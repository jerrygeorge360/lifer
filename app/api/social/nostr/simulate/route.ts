import { NextResponse } from "next/server";
import { z } from "zod";
import { createPendingCheckin } from "@/lib/server/alerting";
import { prisma } from "@/lib/server/prisma";

const schema = z.object({
  username: z.string(),
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    const canary = await prisma.canary.findUnique({ where: { username: body.username } });
    if (!canary) return NextResponse.json({ error: "Canary not found" }, { status: 404 });
    await createPendingCheckin(canary.id, "nostr");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}
