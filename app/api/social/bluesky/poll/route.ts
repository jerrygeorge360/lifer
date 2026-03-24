import { NextResponse } from "next/server";
import { createPendingCheckin } from "@/lib/server/alerting";
import { prisma } from "@/lib/server/prisma";

export async function POST() {
  const canaries = await prisma.canary.findMany({
    include: {
      accounts: {
        where: { platform: "bluesky" },
      },
    },
  });

  let queued = 0;
  for (const canary of canaries) {
    if (canary.accounts.length === 0) continue;
    await createPendingCheckin(canary.id, "bluesky");
    queued += 1;
  }

  return NextResponse.json({ ok: true, queued });
}
