import {
  startAuthentication,
  startRegistration,
} from "@simplewebauthn/browser";

export async function enrollWebAuthn(): Promise<void> {
  const optionsResponse = await fetch("/api/webauthn/register/options", {
    method: "POST",
  });

  if (!optionsResponse.ok) {
    const { error } = (await optionsResponse.json()) as { error?: string };
    throw new Error(error ?? "Could not start passkey registration.");
  }

  const options = await optionsResponse.json();
  const response = await startRegistration({ optionsJSON: options });

  const verifyResponse = await fetch("/api/webauthn/register/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ response }),
  });

  if (!verifyResponse.ok) {
    const { error } = (await verifyResponse.json()) as { error?: string };
    throw new Error(error ?? "Passkey registration failed.");
  }
}

export async function verifyWebAuthnAssertion(): Promise<void> {
  const optionsResponse = await fetch("/api/webauthn/auth/options", {
    method: "POST",
  });

  if (!optionsResponse.ok) {
    const { error } = (await optionsResponse.json()) as { error?: string };
    throw new Error(error ?? "Could not start passkey authentication.");
  }

  const options = await optionsResponse.json();
  const response = await startAuthentication({ optionsJSON: options });

  const verifyResponse = await fetch("/api/webauthn/auth/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ response }),
  });

  if (!verifyResponse.ok) {
    const { error } = (await verifyResponse.json()) as { error?: string };
    throw new Error(error ?? "Passkey verification failed.");
  }
}
