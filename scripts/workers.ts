import "dotenv/config";
import path from "path";
import dotenv from "dotenv";

// Load .env.local if it exists
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { createQueues, startWorkers } from "../lib/server/workers";

async function main() {
  const { thresholdQueue, blueskyQueue } = createQueues();
  startWorkers();

  await thresholdQueue.add("hourly-check", {}, { repeat: { every: 60 * 60 * 1000 } });
  await blueskyQueue.add("poll-bluesky", {}, { repeat: { every: 30 * 60 * 1000 } });

  // eslint-disable-next-line no-console
  console.log("Lifer workers running");
}

void main();
