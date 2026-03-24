import { AlertReason, CanaryStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { fireAlert } from "@/lib/server/alerting";
import { getCurrentSessionUser } from "@/lib/server/auth";
import { uploadAttestationToIpfs } from "@/lib/server/ipfs";
import { prisma } from "@/lib/server/prisma";
import { verifyEd25519Signature } from "@/lib/server/verify";

const attestationSchema = z.object({
  payload: z.object({
    username: z.string(),
    did: z.string(),
    timestamp: z.string(),
    statement: z.string(),
    isDistress: z.boolean(),
  }),
  signature: z.string().min(20),
});

export async function POST(request: Request) {
  const sessionUser = await getCurrentSessionUser();
  if (!sessionUser || !sessionUser.canary) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = attestationSchema.parse(await request.json());
    const { payload, signature } = body;

    if (payload.username !== sessionUser.username || payload.did !== sessionUser.did) {
      return NextResponse.json({ error: "Payload identity mismatch." }, { status: 400 });
    }

    if (!payload.isDistress) {
      const pending = await prisma.pendingCheckin.findFirst({
        where: {
          canaryId: sessionUser.canary.id,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: "desc" },
      });

      if (!pending) {
        return NextResponse.json({ error: "No pending social post confirmation found." }, { status: 400 });
      }

      await prisma.pendingCheckin.delete({ where: { id: pending.id } });
    }

    const publicKeyRaw = payload.isDistress ? sessionUser.distressKey : sessionUser.publicKey;
    const publicKey = JSON.parse(publicKeyRaw) as JsonWebKey;
    const verified = await verifyEd25519Signature(publicKey, payload, signature);
    if (!verified) {
      return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
    }

    const ipfsCid = await uploadAttestationToIpfs({ ...payload, signature });
    const timestamp = new Date(payload.timestamp);

    await prisma.attestation.create({
      data: {
        canaryId: sessionUser.canary.id,
        ipfsCid,
        payload,
        signature,
        timestamp,
        isDistress: payload.isDistress,
      },
    });

    await prisma.canary.update({
      where: { id: sessionUser.canary.id },
      data: {
        status: payload.isDistress ? CanaryStatus.alerted : CanaryStatus.active,
        lastSeenAt: timestamp,
      },
    });

    if (payload.isDistress) {
      await fireAlert(sessionUser.canary.id, AlertReason.distress);
    }

    return NextResponse.json({ ok: true, ipfsCid });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid payload" }, { status: 400 });
    }
    return NextResponse.json({ error: "Check-in failed." }, { status: 500 });
  }
}
