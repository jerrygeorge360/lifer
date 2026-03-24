import { NextResponse } from "next/server";
import { z } from "zod";
import { createPendingCheckin } from "@/lib/server/alerting";
import { prisma } from "@/lib/server/prisma";

const mastodonWebhookSchema = z.object({
  username: z.string(),
});

export async function POST(request: Request) {
  try {
    const body = mastodonWebhookSchema.parse(await request.json());
    const canary = await prisma.canary.findUnique({ where: { username: body.username } });
    if (!canary) return NextResponse.json({ ok: true });

    await createPendingCheckin(canary.id, "mastodon");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid webhook payload." }, { status: 400 });
  }
}
