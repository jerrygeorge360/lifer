import { Platform } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createPendingCheckin } from "@/lib/server/alerting";
import { getCurrentSessionUser } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";
import { sendPushNotifications } from "@/lib/server/webpush";

const detectedSchema = z.object({
  platform: z.enum(["nostr", "mastodon", "bluesky"]),
});

function toPlatform(platform: "nostr" | "mastodon" | "bluesky"): Platform {
  if (platform === "nostr") return Platform.nostr;
  if (platform === "mastodon") return Platform.mastodon;
  return Platform.bluesky;
}

export async function POST(request: Request) {
  const sessionUser = await getCurrentSessionUser();
  if (!sessionUser || !sessionUser.canary) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { platform } = detectedSchema.parse(await request.json());
    await createPendingCheckin(sessionUser.canary.id, toPlatform(platform));

    const subscriptions = await prisma.pushSubscription.findMany({
      where: { canaryId: sessionUser.canary.id },
    });

    await sendPushNotifications(
      subscriptions.map((subscription) => ({
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      })),
      {
        title: `You just posted on ${platform}`,
        body: "Tap to confirm it was you.",
      },
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid payload" }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not create pending check-in." }, { status: 500 });
  }
}
