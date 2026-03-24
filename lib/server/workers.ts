import { Platform } from "@prisma/client";
import { Queue, Worker } from "bullmq";
import { createPendingCheckin, fireAlert, checkSilenceThresholds } from "@/lib/server/alerting";
import { prisma } from "@/lib/server/prisma";

function connection() {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    throw new Error("REDIS_URL is required to run workers.");
  }
  return { url: redisUrl };
}

export function createQueues() {
  const conn = connection();

  const thresholdQueue = new Queue("threshold-check", { connection: conn });
  const blueskyQueue = new Queue("bluesky-poll", { connection: conn });
  const mastodonQueue = new Queue("mastodon-webhook", { connection: conn });

  return { thresholdQueue, blueskyQueue, mastodonQueue };
}

export function startWorkers() {
  const conn = connection();

  const thresholdWorker = new Worker(
    "threshold-check",
    async () => {
      await checkSilenceThresholds();
    },
    { connection: conn },
  );

  const blueskyWorker = new Worker(
    "bluesky-poll",
    async () => {
      const canaries = await prisma.canary.findMany({
        include: { accounts: { where: { platform: Platform.bluesky } } },
      });

      for (const canary of canaries) {
        if (canary.accounts.length > 0) {
          await createPendingCheckin(canary.id, Platform.bluesky);
        }
      }
    },
    { connection: conn },
  );

  const mastodonWorker = new Worker(
    "mastodon-webhook",
    async (job: { data: { username: string } }) => {
      const canary = await prisma.canary.findUnique({ where: { username: job.data.username } });
      if (canary) {
        await createPendingCheckin(canary.id, Platform.mastodon);
      }
    },
    { connection: conn },
  );

  return { thresholdWorker, blueskyWorker, mastodonWorker };
}

export async function enqueueDeviceLockedAlert(username: string) {
  const canary = await prisma.canary.findUnique({ where: { username } });
  if (canary) {
    await fireAlert(canary.id, "device_locked");
  }
}
