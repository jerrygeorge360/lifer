import { generateRegistrationOptions } from "@simplewebauthn/server";
import { NextResponse } from "next/server";
import { getCurrentSessionUser } from "@/lib/server/auth";
import { prisma } from "@/lib/server/prisma";

function rpIDFromEnv(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) return "localhost";
  try {
    return new URL(appUrl).hostname;
  } catch {
    return "localhost";
  }
}

export async function POST() {
  const user = await getCurrentSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const options = await generateRegistrationOptions({
    rpName: "Lifer",
    rpID: rpIDFromEnv(),
    userName: user.username,
    userDisplayName: user.username,
    attestationType: "none",
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
    },
    excludeCredentials: user.webAuthnCredentialId
      ? [{ id: user.webAuthnCredentialId, transports: ["internal"] }]
      : [],
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { webAuthnChallenge: options.challenge },
  });

  return NextResponse.json(options);
}
