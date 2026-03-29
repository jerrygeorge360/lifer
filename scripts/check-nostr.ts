import "dotenv/config";
import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { prisma } from "../lib/server/prisma";

async function main() {
  console.log("Checking DATABASE_URL:", process.env.DATABASE_URL);
  
  const accounts = await prisma.socialAccount.findMany({
    where: { platform: "nostr" },
    include: { canary: true }
  });
  
  console.log("Nostr Accounts Count:", accounts.length);
  console.log("Details:", JSON.stringify(accounts, null, 2));
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
