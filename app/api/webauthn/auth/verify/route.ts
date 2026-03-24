import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSessionUser } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";

const bodySchema = z.object({ response: z.any() });

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

  if (!user.webAuthnCredentialId || !user.webAuthnPublicKey || !user.webAuthnChallenge) {
    return NextResponse.json({ error: "No passkey challenge in progress." }, { status: 400 });
  }

  const { response } = bodySchema.parse(await request.json());
  const credentialPublicKey = new Uint8Array(user.webAuthnPublicKey);

  const verification = await verifyAuthenticationResponse({
    response,
    expectedChallenge: user.webAuthnChallenge,
    expectedOrigin: originFromEnv(),
    expectedRPID: rpIDFromEnv(),
    credential: {
      id: user.webAuthnCredentialId,
      publicKey: credentialPublicKey,
      counter: user.webAuthnCounter,
    },
    requireUserVerification: false,
  });

  if (!verification.verified) {
    return NextResponse.json({ error: "Authentication failed." }, { status: 401 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      webAuthnCounter: verification.authenticationInfo.newCounter,
      webAuthnChallenge: null,
    },
  });

  return NextResponse.json({ ok: true });
}
