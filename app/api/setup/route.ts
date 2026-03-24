import bcrypt from "bcryptjs";
import { Platform } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSessionUser } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";

const setupSchema = z.object({
  thresholdDays: z.number().int().min(1).max(30),
  realPin: z.string().min(4).max(20),
  duressPin: z.string().min(4).max(20),
  accounts: z.object({
    nostr: z.string().optional(),
    mastodon: z.string().optional(),
    bluesky: z.string().optional(),
  }),
});

function platformValue(value: string): Platform {
  if (value === "nostr") return Platform.nostr;
  if (value === "mastodon") return Platform.mastodon;
  return Platform.bluesky;
}

export async function POST(request: Request) {
  const sessionUser = await getCurrentSessionUser();
  if (!sessionUser || !sessionUser.canary) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = setupSchema.parse(await request.json());
    if (body.realPin === body.duressPin) {
      return NextResponse.json({ error: "Duress PIN must be different." }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: sessionUser.id },
      data: {
        realPinHash: await bcrypt.hash(body.realPin, 12),
        duressPinHash: await bcrypt.hash(body.duressPin, 12),
      },
    });

    await prisma.canary.update({
      where: { id: sessionUser.canary.id },
      data: {
        thresholdDays: body.thresholdDays,
      },
    });

    const accountEntries = Object.entries(body.accounts).filter(([, handle]) => Boolean(handle));
    for (const [platform, handle] of accountEntries) {
      await prisma.socialAccount.upsert({
        where: {
          canaryId_platform: {
            canaryId: sessionUser.canary.id,
            platform: platformValue(platform),
          },
        },
        update: {
          handle: handle!,
          platformId: handle!,
        },
        create: {
          canaryId: sessionUser.canary.id,
          platform: platformValue(platform),
          handle: handle!,
          platformId: handle!,
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid payload" }, { status: 400 });
    }
    return NextResponse.json({ error: "Setup update failed." }, { status: 500 });
  }
}
