self.addEventListener("push", (event) => {
  const payload = event.data ? event.data.json() : { title: "Lifer", body: "New alert" };
  event.waitUntil(
    self.registration.showNotification(payload.title || "Lifer", {
      body: payload.body || "New canary event",
      icon: "/icon-192.png",
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow("/dashboard"));
});
