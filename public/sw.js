// ─────────────────────────────────────────────────────────────────────────────
// Lifer — Production Service Worker
// Handles: install, activate, fetch (caching), push, notification click,
//          background sync for offline attestation queuing.
// ─────────────────────────────────────────────────────────────────────────────

const CACHE_VERSION = "lifer-v1";
const OFFLINE_PAGE  = "/";

// Pages and assets to pre-cache on install so the app shell works offline
const PRECACHE_URLS = [
  "/",
  "/register",
  "/dashboard",
  "/setup",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
];

// ─── INSTALL ──────────────────────────────────────────────────────────────────
// Pre-cache the app shell. skipWaiting() activates this SW immediately without
// waiting for old tabs to close.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ─── ACTIVATE ─────────────────────────────────────────────────────────────────
// Delete any caches from older SW versions to free storage.
// clients.claim() lets this SW control all open tabs immediately.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_VERSION)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ─── FETCH ────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests from this origin
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // ── API routes: Network-only ──────────────────────────────────────────────
  // Security-critical data must always be fresh. Never serve stale auth,
  // attestations, or canary state from cache.
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(
          JSON.stringify({
            error: "You are offline. Please reconnect to perform this action.",
          }),
          {
            status: 503,
            headers: { "Content-Type": "application/json" },
          }
        )
      )
    );
    return;
  }

  // ── Next.js static chunks: Cache-first ───────────────────────────────────
  // _next/static files have content-hash filenames — they're immutable.
  // Cache them forever; fetch + cache on first miss.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
            }
            return response;
          })
      )
    );
    return;
  }

  // ── Next.js image optimisation: Network-first, cache fallback ────────────
  if (url.pathname.startsWith("/_next/image")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // ── App pages: Stale-while-revalidate ────────────────────────────────────
  // Serve cached version instantly, update cache in background.
  // Falls back to cached OFFLINE_PAGE if completely offline.
  event.respondWith(
    caches.open(CACHE_VERSION).then((cache) =>
      cache.match(request).then((cached) => {
        const networkFetch = fetch(request)
          .then((response) => {
            if (response.ok) {
              cache.put(request, response.clone());
            }
            return response;
          })
          .catch(() => {
            // Offline and nothing cached — return the cached home page
            return cached || cache.match(OFFLINE_PAGE);
          });

        // Return cached immediately if available, otherwise wait for network
        return cached || networkFetch;
      })
    )
  );
});

// ─── PUSH NOTIFICATIONS ───────────────────────────────────────────────────────
// Payload shape sent by lib/server/webpush.ts → sendPushNotifications():
// { title, body, tag?, url?, requireInteraction? }
self.addEventListener("push", (event) => {
  let payload = {
    title: "Lifer Alert",
    body: "New canary event.",
    tag: "lifer-default",
    url: "/dashboard",
    requireInteraction: false,
  };

  try {
    if (event.data) {
      payload = { ...payload, ...event.data.json() };
    }
  } catch {
    // Malformed push data — use defaults
  }

  const options = {
    body: payload.body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: payload.tag,
    renotify: true,
    requireInteraction: payload.requireInteraction,
    data: { url: payload.url },
    // Action buttons shown on the lock screen / notification shade
    actions: [
      { action: "checkin", title: "✓  I'm Safe" },
      { action: "dismiss", title: "Dismiss" },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, options)
  );
});

// ─── NOTIFICATION CLICK ───────────────────────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  // "I'm Safe" action: go to dashboard with the confirm action pre-selected
  const targetUrl =
    event.action === "checkin"
      ? "/dashboard?action=checkin"
      : event.notification.data?.url || "/dashboard";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Focus an existing tab if one is already open
        const existing = clientList.find(
          (c) => c.url.includes("/dashboard") || c.url.includes(targetUrl)
        );
        if (existing) return existing.focus();
        // Otherwise open a new window
        return clients.openWindow(targetUrl);
      })
  );
});

// ─── BACKGROUND SYNC ─────────────────────────────────────────────────────────
// If a check-in attestation is created while offline, it's queued in a
// dedicated cache. When connectivity returns, the browser fires this sync
// event and we drain the queue to /api/checkin.
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-checkins") {
    event.waitUntil(drainCheckinQueue());
  }
});

async function drainCheckinQueue() {
  const cache = await caches.open("lifer-checkin-queue");
  const keys = await cache.keys();

  for (const request of keys) {
    try {
      const cached = await cache.match(request);
      if (!cached) continue;

      const body = await cached.json();

      const response = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        await cache.delete(request);
        console.log("[Lifer SW] Queued check-in synced successfully.");
      }
    } catch (err) {
      // Will retry on next sync event
      console.warn("[Lifer SW] Background sync failed for queued check-in:", err);
    }
  }
}

// ─── MESSAGE CHANNEL ──────────────────────────────────────────────────────────
// The dashboard page can send messages to the SW — e.g. to queue an offline
// attestation or trigger a manual sync check.
self.addEventListener("message", (event) => {
  if (!event.data) return;

  switch (event.data.type) {
    // Page sends this when user submits a check-in while offline
    case "QUEUE_CHECKIN": {
      const { payload, signature } = event.data;
      queueOfflineCheckin(payload, signature);
      break;
    }
    // Force the SW to check for its own update
    case "CHECK_FOR_UPDATE": {
      self.registration.update();
      break;
    }
    // Sent by layout after new SW installs
    case "SKIP_WAITING": {
      self.skipWaiting();
      break;
    }
  }
});

async function queueOfflineCheckin(payload, signature) {
  const cache = await caches.open("lifer-checkin-queue");
  const key = `/queue/checkin-${Date.now()}`;
  const body = JSON.stringify({ payload, signature });
  await cache.put(
    key,
    new Response(body, { headers: { "Content-Type": "application/json" } })
  );
  console.log("[Lifer SW] Check-in queued for background sync:", key);
}