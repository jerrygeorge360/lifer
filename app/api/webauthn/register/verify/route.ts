import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { NextResponse } from "next/server";
import { Buffer } from "node:buffer";
import { z } from "zod";
import { getCurrentSessionUser } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";

const bodySchema = z.object({
  response: z.any(),
});

function rpIDFromEnv(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) return "localhost";
  try {
    return new URL(appUrl).hostname;
  } catch {
    return "localhost";
  }
}

function originFromEnv(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export async function POST(request: Request) {
  const user = await getCurrentSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { response } = bodySchema.parse(await request.json());
  if (!user.webAuthnChallenge) {
    return NextResponse.json({ error: "No WebAuthn challenge in progress." }, { status: 400 });
  }

  const verification = await verifyRegistrationResponse({
    response,
    expectedChallenge: user.webAuthnChallenge,
    expectedOrigin: originFromEnv(),
    expectedRPID: rpIDFromEnv(),
    requireUserVerification: false,
  });

  if (!verification.verified || !verification.registrationInfo) {
    return NextResponse.json({ error: "WebAuthn verification failed." }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      webAuthnCredentialId: verification.registrationInfo.credential.id,
      webAuthnPublicKey: Buffer.from(verification.registrationInfo.credential.publicKey),
      webAuthnCounter: verification.registrationInfo.credential.counter,
      webAuthnChallenge: null,
    },
  });

  return NextResponse.json({ ok: true });
}
