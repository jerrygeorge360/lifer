import { Platform } from "@prisma/client";
import { Queue, Worker } from "bullmq";
import {
  createPendingCheckin,
  fireAlert,
  checkSilenceThresholds,
} from "@/lib/server/alerting";
import { prisma } from "@/lib/server/prisma";
import { Relay } from "nostr-tools/relay";
import { nip19 } from "nostr-tools";
import { sendPushNotifications } from "@/lib/server/webpush";

// ─── Queue / Worker boilerplate (unchanged) ────────────────────────────────

function connection() {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) throw new Error("REDIS_URL is required to run workers.");
  return { url: redisUrl };
}

export function createQueues() {
  const conn = connection();
  return {
    thresholdQueue: new Queue("threshold-check", { connection: conn }),
    // Bluesky & Mastodon: Coming Soon
  };
}

export function startWorkers() {
  const conn = connection();

  const thresholdWorker = new Worker(
    "threshold-check",
    async () => { await checkSilenceThresholds(); },
    { connection: conn },
  );

  console.log("Lifer workers running — [Nostr-Primary Mode]");
  console.log("ℹ️  Bluesky & Mastodon: Monitoring coming soon.");

  return { thresholdWorker };
}

// ─── Nostr Monitor ─────────────────────────────────────────────────────────

const RELAY_URLS = [
  "wss://nos.lol",
  "wss://relay.damus.io",
  "wss://relay.snort.social",
];

/**
 * Kinds to watch:
 *   1  = public post
 *   4  = NIP-04 encrypted DM
 *   14 = NIP-17 private DM
 */
const WATCHED_KINDS = [1, 4, 14];

/**
 * Global deduplication set.
 *
 * Multiple relays will deliver the SAME event almost simultaneously.
 * Without this, your proof workflow fires 3-4 times per post.
 * We store event IDs we've already handled so only the FIRST relay
 * delivery wins and the rest are silently dropped.
 */
const seenEventIds = new Set<string>();
const SEEN_MAX_SIZE = 5_000;

function markSeen(id: string): boolean {
  if (seenEventIds.has(id)) return false;
  seenEventIds.add(id);
  if (seenEventIds.size > SEEN_MAX_SIZE) {
    const [first] = seenEventIds;
    seenEventIds.delete(first);
  }
  return true;
}

function toHexPubkey(handle: string): string | null {
  const trimmed = handle.trim();
  if (trimmed.startsWith("npub1")) {
    try {
      const decoded = nip19.decode(trimmed);
      if (decoded.type === "npub") return decoded.data as string;
    } catch { /* fall through */ }
    return null;
  }
  return /^[0-9a-f]{64}$/i.test(trimmed) ? trimmed : null;
}

export async function startNostrMonitor() {
  const accounts = await prisma.socialAccount.findMany({
    where: { platform: Platform.nostr },
    include: {
      canary: { include: { pushSubscriptions: true } },
    },
  });

  if (accounts.length === 0) {
    console.log("[Nostr] ℹ️  No Nostr accounts configured. Monitor idle.");
    return;
  }

  // Pre-index accounts by hex pubkey for O(1) event lookup
  const pubkeyToAccount = new Map<string, (typeof accounts)[number]>();
  for (const account of accounts) {
    const hex = toHexPubkey(account.handle);
    if (hex) {
      pubkeyToAccount.set(hex, account);
    } else {
      console.warn(`[Nostr] ⚠️  Could not decode handle "${account.handle}" — skipping.`);
    }
  }

  const hexPubkeys = [...pubkeyToAccount.keys()];

  if (hexPubkeys.length === 0) {
    console.log("[Nostr] ℹ️  No valid pubkeys. Monitor idle.");
    return;
  }

  console.log(`[Nostr] 🚀 Real-time monitor started for ${hexPubkeys.length} pubkey(s), kinds [${WATCHED_KINDS.join(", ")}]`);
  console.log(`[Nostr] 🔍 Monitoring Hex: ${hexPubkeys.join(", ")}`);

  async function connectToRelay(url: string, attempt = 0) {
    const tag   = `[Nostr][${url}]`;
    const delay = Math.min(2 ** attempt * 5_000, 5 * 60_000); // 5s → 5 min cap

    try {
      console.log(`${tag} Connecting… (attempt ${attempt + 1})`);
      const relay = await Relay.connect(url);
      console.log(`${tag} ✅ Connected`);

      /**
       * REAL-TIME ONLY: `since` is set to the moment this subscription
       * opens. The relay will only push events with a timestamp >= now,
       * so no historical posts are replayed. This is intentional — the
       * proof workflow must only fire for live, in-the-moment activity.
       *
       * If the server restarts and a post was made in the gap, it will
       * NOT be detected. That is the correct behaviour here because a
       * stale proof trigger would be misleading.
       */
      // Buffer window for clock skew between relays and phone
      const subscribedAt = Math.floor(Date.now() / 1000);
      const since = subscribedAt - 30;

      relay.subscribe(
        [
          {
            authors: hexPubkeys,
            kinds: WATCHED_KINDS,
            since,
          },
        ],
        {
          async onevent(event) {
            console.log(`${tag} 📥 EVENT RECEIVED: id=${event.id.slice(0, 8)} author=${event.pubkey.slice(0, 8)} kind=${event.kind}`);

            // Hard guard: reject anything timestamped before our 'since' window.
            if (event.created_at < since) {
              console.log(`${tag} ⏩ Skipping stale event ${event.id.slice(0, 8)} (created_at ${event.created_at} < since ${since})`);
              return;
            }

            // Deduplication — first relay to deliver this event wins
            if (!markSeen(event.id)) {
              console.log(`${tag} 👯 Deduplicating event ${event.id.slice(0, 8)} (already seen)`);
              return;
            }

            const kindLabel =
              event.kind === 1  ? "public post"           :
              event.kind === 4  ? "encrypted DM (NIP-04)" :
              event.kind === 14 ? "private DM (NIP-17)"   :
              `kind:${event.kind}`;

            console.log(`${tag} 📡 LIVE [${kindLabel}] from ${event.pubkey.slice(0, 8)}… id=${event.id.slice(0, 8)}…`);

            const account = pubkeyToAccount.get(event.pubkey);
            if (!account?.canary) return;

            const { canary } = account;
            console.log(`${tag} 🔏 Triggering proof check-in for @${canary.username}`);

            // ── Fire the proof workflow ────────────────────────────────
            await createPendingCheckin(account.canaryId, Platform.nostr);

            // ── Push notification ──────────────────────────────────────
            if (canary.pushSubscriptions.length > 0) {
              const pushTitle =
                event.kind === 1  ? "New post detected — please sign"  :
                event.kind === 4  ? "New DM detected — please sign"    :
                                    "New Nostr activity — please sign";

              await sendPushNotifications(
                canary.pushSubscriptions.map((sub: any) => ({
                  endpoint: sub.endpoint,
                  keys: { p256dh: sub.p256dh, auth: sub.auth },
                })),
                {
                  title: pushTitle,
                  body: "Tap to sign your cryptographic proof now.",
                },
              );
            }
          },

          onclose() {
            console.warn(`${tag} ⚠️  Disconnected. Reconnecting in ${delay / 1000}s…`);
            setTimeout(() => connectToRelay(url, attempt + 1), delay);
          },
        },
      );

      console.log(`${tag} 👂 Subscribed — waiting for live events`);

      // Health-check: detect silently stalled connections
      const healthCheck = setInterval(() => {
        const isConnected = (relay as any).connected ?? true;
        if (!isConnected) {
          console.warn(`${tag} 💔 Health-check: stale connection detected. Reconnecting…`);
          clearInterval(healthCheck);
          relay.close();
          void connectToRelay(url, 0);
        }
      }, 30_000);

    } catch (err) {
      console.error(`${tag} ❌ Failed to connect:`, err);
      console.log(`${tag} Retrying in ${delay / 1000}s…`);
      setTimeout(() => connectToRelay(url, attempt + 1), delay);
    }
  }

  for (const url of RELAY_URLS) {
    void connectToRelay(url);
  }
}

// ─── Misc ──────────────────────────────────────────────────────────────────

export async function enqueueDeviceLockedAlert(username: string) {
  const canary = await prisma.canary.findUnique({ where: { username } });
  if (canary) await fireAlert(canary.id, "device_locked");
}