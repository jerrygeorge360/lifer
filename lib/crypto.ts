import type { AttestationRecord } from "@/lib/types";

const encoder = new TextEncoder();

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function generateSigningKeyPair(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey(
    {
      name: "Ed25519",
      namedCurve: "Ed25519",
    },
    true,
    ["sign", "verify"],
  );
}

export async function exportKeyToJwk(key: CryptoKey): Promise<JsonWebKey> {
  return crypto.subtle.exportKey("jwk", key);
}

export async function importPrivateSigningKey(jwk: JsonWebKey): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "jwk",
    jwk,
    {
      name: "Ed25519",
      namedCurve: "Ed25519",
    } as unknown as Algorithm,
    false,
    ["sign"],
  );
}

export async function signPayload(privateKey: CryptoKey, payload: object): Promise<string> {
  const data = encoder.encode(JSON.stringify(payload));
  const signature = await crypto.subtle.sign("Ed25519", privateKey, data);

  return bytesToBase64(new Uint8Array(signature));
}

export async function encryptBackup(backupObject: object, passphrase: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 120000,
      hash: "SHA-256",
    },
    keyMaterial,
    {
      name: "AES-GCM",
      length: 256,
    },
    false,
    ["encrypt"],
  );

  const cipherBuffer = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
    },
    key,
    encoder.encode(JSON.stringify(backupObject)),
  );

  return JSON.stringify({
    version: "1.0",
    algorithm: "AES-GCM",
    kdf: "PBKDF2-SHA256",
    iterations: 120000,
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(cipherBuffer)),
  });
}

export function triggerBackupDownload(contents: string, username: string): void {
  const blob = new Blob([contents], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `lifer-keys-${username}.backup.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function createAttestationPayload(
  username: string,
  did: string,
  isDistress: boolean,
): Omit<AttestationRecord, "id" | "signature"> {
  return {
    username,
    did,
    timestamp: new Date().toISOString(),
    statement: isDistress
      ? "Distress signal. I need help."
      : "I am okay. I have not been coerced. This message is signed freely.",
    isDistress,
  };
}

export function decodeBackupField(base64Value: string): Uint8Array {
  return base64ToBytes(base64Value);
}
