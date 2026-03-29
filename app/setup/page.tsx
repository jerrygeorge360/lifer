"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { GlassCard } from "@/components/ui";
import { getSession, postJson } from "@/lib/api";
import { getRegistration, saveSetup } from "@/lib/storage";
import { enrollWebAuthn } from "@/lib/webauthn";

export default function SetupPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [thresholdDays, setThresholdDays] = useState(3);
  const [realPin, setRealPin] = useState("");
  const [duressPin, setDuressPin] = useState("");
  const [nostr, setNostr] = useState("");
  const [mastodon, setMastodon] = useState("");
  const [bluesky, setBluesky] = useState("");
  const [error, setError] = useState("");
  const [webAuthnBusy, setWebAuthnBusy] = useState(false);
  const [webAuthnComplete, setWebAuthnComplete] = useState(false);

  useEffect(() => {
    async function hydrate() {
      const session = await getSession();
      if (session?.canary) {
        setThresholdDays(session.canary.thresholdDays);
        setNostr(session.canary.accounts.nostr ?? "");
        setMastodon(session.canary.accounts.mastodon ?? "");
        setBluesky(session.canary.accounts.bluesky ?? "");
        setWebAuthnComplete(session.user.hasWebAuthn);
      }
      setReady(true);
    }

    void hydrate();
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!realPin || !duressPin) {
      setError("PIN and duress PIN are required.");
      return;
    }

    if (realPin === duressPin) {
      setError("Duress PIN must be different from your real PIN.");
      return;
    }

    try {
      await postJson("/api/setup", {
        thresholdDays,
        realPin,
        duressPin,
        accounts: {
          nostr,
          mastodon,
          bluesky,
        },
      });

      saveSetup({
        thresholdDays,
        realPin,
        duressPin,
        accounts: {
          nostr,
          mastodon,
          bluesky,
        },
      });

      router.push("/dashboard");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to save setup.");
    }
  }

  async function onEnrollPasskey() {
    setError("");
    setWebAuthnBusy(true);

    try {
      await enrollWebAuthn();
      setWebAuthnComplete(true);
    } catch (enrollError) {
      setError(enrollError instanceof Error ? enrollError.message : "Passkey enrollment failed.");
    } finally {
      setWebAuthnBusy(false);
    }
  }

  if (!ready) return null;

  if (!getRegistration()) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-3xl px-6 py-12">
        <GlassCard className="fade-in-up p-12 text-center">
          <h1 className="heading-serif text-4xl text-white">Setup Unavailable</h1>
          <p className="mt-4" style={{ color: "var(--text-muted)" }}>
            Identity initialization required.
          </p>
          <Link href="/register" className="mt-6 inline-block">
            <button className="glass-button-primary">
              Generate Identity
            </button>
          </Link>
        </GlassCard>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-6 py-12">
      <Link href="/dashboard" className="mono-caps inline-flex items-center text-xs transition-colors" style={{ color: "var(--safe-green)" }}>
        ← Mission Control
      </Link>
      
      <div className="fade-in-up mt-12 space-y-4">
        <div className="badge-gold">Configuration Sequence</div>
        <h1 className="heading-serif text-6xl text-white">Security Setup</h1>
        <p style={{ color: "var(--text-muted)" }}>
          Configure operational parameters, authentication methods, and monitored accounts.
        </p>
      </div>

      {/* WebAuthn Enrollment */}
      <GlassCard className="fade-in-up-2 mt-12 p-8">
        <p className="mono-caps mb-4 text-xs text-white">
          Step 1: Biometric Authentication
        </p>
        <p className="mb-6 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
          Enroll Face ID, Touch ID, or Windows Hello for secure check-in verification.
          Required for normal attestations (distress keypair bypasses this).
        </p>
        <button
          type="button"
          onClick={onEnrollPasskey}
          disabled={webAuthnBusy || webAuthnComplete}
          className="glass-button"
        >
          {webAuthnComplete ? "✓ Passkey Enrolled" : webAuthnBusy ? "Enrolling..." : "Enroll Biometric Security"}
        </button>
      </GlassCard>

      {/* Configuration Form */}
      <form onSubmit={onSubmit} className="mt-6 space-y-6">
        <GlassCard className="fade-in-up-3 p-8">
          <p className="mono-caps mb-6 text-xs text-white">
            Step 2: Operational Parameters
          </p>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="mono-caps block text-xs text-white">
                Silence Threshold (Days)
              </label>
              <input
                type="number"
                min={1}
                max={14}
                value={thresholdDays}
                onChange={(event) => setThresholdDays(Number(event.target.value))}
                className="glass-input w-full"
              />
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Alert fires if you go silent for this many days. Recommended: 3-7 days.
              </p>
            </div>

            <div className="space-y-2">
              <label className="mono-caps block text-xs text-white">
                Normal PIN
              </label>
              <input
                value={realPin}
                onChange={(event) => setRealPin(event.target.value)}
                className="glass-input w-full"
                placeholder="Enter PIN"
              />
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Backup authentication if biometrics fail. 4-8 characters recommended.
              </p>
            </div>

            <div className="space-y-2">
              <label className="mono-caps block text-xs text-white">
                Duress PIN
              </label>
              <input
                value={duressPin}
                onChange={(event) => setDuressPin(event.target.value)}
                className="glass-input w-full"
                placeholder="Enter different PIN"
              />
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                <span style={{ color: "var(--alert-red)" }}>Must differ from normal PIN.</span> Silently fires distress signal while appearing normal.
              </p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="fade-in-up-4 p-8">
          <p className="mono-caps mb-6 text-xs text-white">
            Step 3: Monitored Social Accounts (Optional)
          </p>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="mono-caps block text-xs text-white">
                Nostr Public Key
              </label>
              <input
                value={nostr}
                onChange={(event) => setNostr(event.target.value.trim())}
                className="glass-input w-full"
                placeholder="npub1..."
              />
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Decentralized protocol. Workers monitor for new posts.
              </p>
            </div>

            <div className="space-y-2">
              <label className="mono-caps block text-xs text-white">
                Mastodon Handle (Coming Soon)
              </label>
              <input
                value={mastodon}
                disabled
                onChange={(event) => setMastodon(event.target.value.trim())}
                className="glass-input w-full opacity-50 cursor-not-allowed"
                placeholder="@user@instance.social"
              />
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Full handle including instance domain.
              </p>
            </div>

            <div className="space-y-2">
              <label className="mono-caps block text-xs text-white">
                Bluesky Handle (Coming Soon)
              </label>
              <input
                value={bluesky}
                disabled
                onChange={(event) => setBluesky(event.target.value.trim())}
                className="glass-input w-full opacity-50 cursor-not-allowed"
                placeholder="user.bsky.social"
              />
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Your Bluesky handle. Workers poll for activity.
              </p>
            </div>
          </div>
        </GlassCard>

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

        <button type="submit" className="glass-button-primary w-full">
          Complete Setup & Enter Mission Control
        </button>
      </form>
    </main>
  );
}
