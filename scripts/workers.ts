import "dotenv/config";
import path from "path";
import dotenv from "dotenv";

// Load .env.local if it exists
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { createQueues, startWorkers, startNostrMonitor } from "@/lib/server/workers";

async function main() {
  const { thresholdQueue } = createQueues();
  startWorkers();
  await startNostrMonitor();

  // Run threshold check every 1 minute for rapid safety monitoring
  await thresholdQueue.add("threshold-check", {}, { repeat: { every: 60 * 1000 } });

  console.log("Lifer Nostr-First Workers Active.");
}

void main();
