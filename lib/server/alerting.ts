import { AlertReason, CanaryStatus, Platform } from "@prisma/client";
import { notifySubscribers } from "@/lib/server/notify";
import { prisma } from "@/lib/server/prisma";

export async function createPendingCheckin(canaryId: string, platform: Platform): Promise<void> {
  await prisma.pendingCheckin.create({
    data: {
      canaryId,
      platform,
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
    },
  });
}

export async function fireAlert(canaryId: string, reason: AlertReason): Promise<void> {
  const canary = await prisma.canary.findUnique({
    where: { id: canaryId },
    include: {
      subscribers: true,
      user: true,
    },
  });

  if (!canary) return;

  const title = `Lifer alert for @${canary.username}`;
  const message =
    reason === AlertReason.silence
      ? `${canary.username} has crossed the silence threshold.`
      : reason === AlertReason.device_locked
        ? `${canary.username} device has been locked after failed attempts.`
        : `${canary.username} sent a distress signal.`;

  const notified = await notifySubscribers(
    canary.subscribers.map((subscriber) => ({
      email: subscriber.email,
      telegramId: subscriber.telegramId,
    })),
    title,
    message,
  );

  await prisma.alert.create({
    data: {
      canaryId,
      reason,
      notified,
    },
  });

  await prisma.canary.update({
    where: { id: canaryId },
    data: { status: CanaryStatus.alerted },
  });
}

export async function checkSilenceThresholds(): Promise<number> {
  const canaries = await prisma.canary.findMany({ where: { status: CanaryStatus.active } });
  let fired = 0;

  // For testing purposes, we can treat thresholdDays as thresholdMinutes.
  const isTestMode = process.env.TEST_MODE === "true";

  for (const canary of canaries) {
    if (!canary.lastSeenAt) continue;

    const msSilent = Date.now() - canary.lastSeenAt.getTime();
    const minutesSilent = msSilent / 1000 / 60;
    const hoursSilent = minutesSilent / 60;

    const limitInHours = isTestMode ? canary.thresholdDays / 60 : canary.thresholdDays * 24;

    if (hoursSilent >= limitInHours) {
      await fireAlert(canary.id, AlertReason.silence);
      fired += 1;
    }
  }

  return fired;
}
