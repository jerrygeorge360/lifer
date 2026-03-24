import { Buffer } from "node:buffer";

const encoder = new TextEncoder();

function normalizeJwk(jwk: unknown): JsonWebKey {
  if (typeof jwk !== "object" || jwk === null) {
    throw new Error("Invalid JWK");
  }
  return jwk as JsonWebKey;
}

export async function verifyEd25519Signature(
  publicJwk: unknown,
  payload: object,
  signatureBase64: string,
): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    "jwk",
    normalizeJwk(publicJwk),
    {
      name: "Ed25519",
      namedCurve: "Ed25519",
    } as unknown as Algorithm,
    false,
    ["verify"],
  );

  const signature = Buffer.from(signatureBase64, "base64");
  const data = encoder.encode(JSON.stringify(payload));
  return crypto.subtle.verify("Ed25519", key, signature, data);
}
