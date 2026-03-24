import { generateAuthenticationOptions } from "@simplewebauthn/server";
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

  if (!user.webAuthnCredentialId) {
    return NextResponse.json({ error: "No passkey enrolled." }, { status: 400 });
  }

  const options = await generateAuthenticationOptions({
    rpID: rpIDFromEnv(),
    allowCredentials: [{ id: user.webAuthnCredentialId, transports: ["internal"] }],
    userVerification: "preferred",
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { webAuthnChallenge: options.challenge },
  });

  return NextResponse.json(options);
}
