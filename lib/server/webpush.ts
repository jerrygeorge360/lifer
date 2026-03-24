import webpush from "web-push";

let configured = false;

function ensureWebPushConfigured(): boolean {
  if (configured) return true;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return false;

  webpush.setVapidDetails("mailto:alerts@lifer.local", publicKey, privateKey);
  configured = true;
  return true;
}

export async function sendPushNotifications(
  subscriptions: Array<{ endpoint: string; keys: { p256dh: string; auth: string } }>,
  payload: object,
): Promise<void> {
  if (!ensureWebPushConfigured()) return;

  await Promise.allSettled(
    subscriptions.map((subscription) => webpush.sendNotification(subscription as never, JSON.stringify(payload))),
  );
}
