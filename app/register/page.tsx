"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import {
  encryptBackup,
  exportKeyToJwk,
  generateSigningKeyPair,
  triggerBackupDownload,
} from "@/lib/crypto";
import { postJson } from "@/lib/api";
import { saveRegistration } from "@/lib/storage";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [backupPassphrase, setBackupPassphrase] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (!username || !email || !password || !backupPassphrase) {
        throw new Error("All fields are required.");
      }

      const [mainKeys, distressKeys] = await Promise.all([
        generateSigningKeyPair(),
        generateSigningKeyPair(),
      ]);

      const [publicKeyMain, publicKeyDistress, privateKeyMain, privateKeyDistress] = await Promise.all([
        exportKeyToJwk(mainKeys.publicKey),
        exportKeyToJwk(distressKeys.publicKey),
        exportKeyToJwk(mainKeys.privateKey),
        exportKeyToJwk(distressKeys.privateKey),
      ]);

      const did = `did:lifer:${crypto.randomUUID()}`;
      const createdAt = new Date().toISOString();

      const registrationResponse = await postJson<{
        user: { id: string; username: string; email: string; did: string };
      }>("/api/auth/register", {
        username,
        email,
        password,
        did,
        publicKeyMain,
        publicKeyDistress,
      });

      saveRegistration({
        userId: registrationResponse.user.id,
        username,
        email,
        did,
        publicKeyMain,
        publicKeyDistress,
        privateKeyMain,
        privateKeyDistress,
        createdAt,
      });

      const encryptedBackup = await encryptBackup(
        {
          version: "1.0",
          createdAt,
          did,
          username,
          email,
          privateKeyMain,
          privateKeyDistress,
        },
        backupPassphrase,
      );

      triggerBackupDownload(encryptedBackup, username);
      router.push("/setup");
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Registration failed.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen">
      <main className="mx-auto max-w-3xl px-6 py-12">
        <Link href="/" className="mono-caps inline-flex items-center text-xs transition-colors" style={{ color: "var(--safe-green)" }}>
          ← Protocol Index
        </Link>
        
        <div className="fade-in-up mt-12 space-y-4">
          <div className="badge-gold">Initialization Sequence</div>
          <h1 className="heading-serif text-6xl text-white">Generate Identity</h1>
          <p className="text-base" style={{ color: "var(--text-muted)" }}>
            Your identity and cryptographic keypairs are generated client-side.
            <br />
            <span className="font-semibold" style={{ color: "var(--safe-green)" }}>
              Private keys never touch the server.
            </span>
          </p>
        </div>

        <form onSubmit={onSubmit} className="glass-card fade-in-up-2 mt-12 space-y-8 p-10">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="mono-caps block text-xs text-white">Username</label>
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value.trim())}
                className="glass-input w-full"
                placeholder="operative_alias"
              />
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                This will be your public canary identifier.
              </p>
            </div>

            <div className="space-y-2">
              <label className="mono-caps block text-xs text-white">Email</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value.trim())}
                className="glass-input w-full"
                placeholder="secure@protonmail.com"
              />
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                For account recovery and subscriber notifications.
              </p>
            </div>

            <div className="space-y-2">
              <label className="mono-caps block text-xs text-white">Password</label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="glass-input w-full"
                placeholder="••••••••••••••••"
              />
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Strong passphrase recommended. Minimum 12 characters.
              </p>
            </div>

            <div className="space-y-2">
              <label className="mono-caps block text-xs text-white">Backup Passphrase</label>
              <input
                type="password"
                value={backupPassphrase}
                onChange={(event) => setBackupPassphrase(event.target.value)}
                className="glass-input w-full"
                placeholder="••••••••••••••••"
              />
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Encrypts your private key backup. <span className="font-semibold" style={{ color: "var(--alert-red)" }}>We cannot recover this.</span>
              </p>
            </div>
          </div>

          {error ? (
            <div 
              className="rounded-lg border p-4"
              style={{ 
                borderColor: "var(--alert-red)", 
                background: "rgba(192, 57, 43, 0.1)" 
              }}
            >
              <p className="mono-caps text-xs" style={{ color: "var(--alert-red)" }}>
                {error}
              </p>
            </div>
          ) : null}

          <div 
            className="rounded-lg border p-6"
            style={{ 
              borderColor: "var(--gold-accent)", 
              background: "rgba(201, 169, 110, 0.05)" 
            }}
          >
            <div className="flex items-start gap-4">
              <div className="mt-0.5" style={{ color: "var(--gold-accent)" }}>⚠</div>
              <div className="space-y-2 text-sm" style={{ color: "var(--text-muted)" }}>
                <p className="mono-caps text-xs font-semibold text-white">
                  Critical Security Protocol
                </p>
                <p>
                  Two Ed25519 keypairs will be generated:
                </p>
                <ul className="list-inside list-disc space-y-1 pl-1">
                  <li><span className="font-semibold" style={{ color: "var(--safe-green)" }}>Normal keypair:</span> Standard attestations</li>
                  <li><span className="font-semibold" style={{ color: "var(--alert-red)" }}>Distress keypair:</span> Silent alarm when coerced</li>
                </ul>
                <p className="pt-2">
                  An encrypted backup will download automatically. Store it offline.
                  <span className="font-semibold"> Loss of backup = loss of identity.</span>
                </p>
              </div>
            </div>
          </div>

          <button
            disabled={isSubmitting}
            className="glass-button-primary w-full"
            type="submit"
          >
            {isSubmitting ? "Generating Keypairs..." : "Initialize Identity & Download Backup"}
          </button>
        </form>

        <p className="mt-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
          Already have a canary?{" "}
          <Link href="/dashboard" className="font-semibold transition-colors" style={{ color: "var(--safe-green)" }}>
            Access Dashboard
          </Link>
        </p>
      </main>
    </div>
  );
}
