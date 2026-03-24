import { NextResponse } from "next/server";
import { getCurrentSessionUser } from "@/lib/server/auth";

export async function GET() {
  const user = await getCurrentSessionUser();
  if (!user || !user.canary) {
    return NextResponse.json({ user: null, canary: null }, { status: 401 });
  }

  const canary = user.canary;
  return NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      did: user.did,
      hasWebAuthn: Boolean(user.webAuthnCredentialId),
    },
    canary: {
      id: canary.id,
      username: canary.username,
      thresholdDays: canary.thresholdDays,
      status: canary.status,
      lastSeenAt: canary.lastSeenAt,
      accounts: canary.accounts,
      attestations: canary.attestations,
    },
  });
}
