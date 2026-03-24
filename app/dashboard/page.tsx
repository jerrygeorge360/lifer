"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { StatusOrb, GlassCard } from "@/components/ui";
import {
  createAttestationPayload,
  importPrivateSigningKey,
  signPayload,
} from "@/lib/crypto";
import { getSession, postJson, type SessionPayload } from "@/lib/api";
import { getRegistration } from "@/lib/storage";
import type { AttestationRecord, RegistrationState } from "@/lib/types";
import { verifyWebAuthnAssertion } from "@/lib/webauthn";

function formatRelative(dateIso: string | null): string {
  if (!dateIso) return "No verified check-in yet";
  const ms = Date.now() - new Date(dateIso).getTime();
  const minutes = Math.floor(ms / 1000 / 60);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function DashboardPage() {
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [registration, setRegistration] = useState<RegistrationState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<"normal" | "distress" | null>(null);
  const [detectBusy, setDetectBusy] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<"nostr" | "mastodon" | "bluesky">("nostr");
  const [pendingHint, setPendingHint] = useState("No pending social post confirmation.");
  const [pushBusy, setPushBusy] = useState(false);
  const [pushReady, setPushReady] = useState(false);

  useEffect(() => {
    async function hydrate() {
      const [remote, localIdentity] = await Promise.all([getSession(), Promise.resolve(getRegistration())]);
      setSession(remote);
      setRegistration(localIdentity);
      setLoading(false);
    }

    void hydrate();
  }, []);

  const canary = session?.canary ?? null;
  const latestAttestation = canary?.attestations[0] ?? null;

  async function createCheckin(isDistress: boolean) {
    setError("");
    setBusy(isDistress ? "distress" : "normal");

    try {
      if (!registration || !canary || !session?.user) {
        throw new Error("No canary account found. Register first.");
      }

      if (!isDistress) {
        await verifyWebAuthnAssertion();
      }

      const privateJwk = isDistress ? registration.privateKeyDistress : registration.privateKeyMain;
      const key = await importPrivateSigningKey(privateJwk);
      const payload = createAttestationPayload(session.user.username, session.user.did, isDistress);
      const signature = await signPayload(key, payload);

      await postJson<{ ok: boolean; ipfsCid: string }>("/api/checkin", {
        payload,
        signature,
      });

      const refreshed = await getSession();
      setSession(refreshed);
      setPendingHint("No pending social post confirmation.");
    } catch (checkinError) {
      const message = checkinError instanceof Error ? checkinError.message : "Failed to create attestation.";
      setError(message);
    } finally {
      setBusy(null);
    }
  }

  async function simulatePostDetected() {
    setError("");
    setDetectBusy(true);

    try {
      await postJson("/api/social/detected", { platform: selectedPlatform });
      setPendingHint(`Pending ${selectedPlatform} confirmation created. Complete check-in within 2 hours.`);
    } catch (detectError) {
      setError(detectError instanceof Error ? detectError.message : "Could not create pending check-in.");
    } finally {
      setDetectBusy(false);
    }
  }

  async function enablePushAlerts() {
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setError("Push notifications are not supported in this browser.");
      return;
    }

    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) {
      setError("VAPID public key is missing.");
      return;
    }

    setPushBusy(true);
    setError("");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        throw new Error("Notification permission denied.");
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      const existing = await registration.pushManager.getSubscription();
      const subscription =
        existing ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: Uint8Array.from(atob(vapidKey), (char) => char.charCodeAt(0)),
        }));

      await postJson("/api/push/subscribe", subscription.toJSON());
      setPushReady(true);
    } catch (pushError) {
      setError(pushError instanceof Error ? pushError.message : "Could not enable push alerts.");
    } finally {
      setPushBusy(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-6xl px-6 py-12">
        <div className="fade-in-up text-center">
          <div className="mono-caps text-xs" style={{ color: "var(--text-muted)" }}>
            Authenticating...
          </div>
        </div>
      </main>
    );
  }

  if (!registration || !canary || !session?.user) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-6xl px-6 py-12">
        <GlassCard className="fade-in-up p-12 text-center">
          <h1 className="heading-serif text-4xl text-white">No Canary Found</h1>
          <p className="mt-4" style={{ color: "var(--text-muted)" }}>
            Initialize your identity to begin monitoring.
          </p>
          <Link href="/register" className="mt-6 inline-block">
            <button className="glass-button-primary">
              Initialize Protocol
            </button>
          </Link>
        </GlassCard>
      </main>
    );
  }

  const statusMode = canary.status === "alerted" ? "alert" : "safe";

  return (
    <main className={`mx-auto min-h-screen w-full max-w-6xl px-6 py-12 ${statusMode === "alert" ? "alert-vignette" : ""}`}>
      <div className="fade-in-up flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="badge-gold">Mission Control</div>
          <h1 className="heading-serif mt-2 text-5xl text-white">Dashboard</h1>
        </div>
        <Link href={`/canary/${session.user.username}`}>
          <button className="glass-button">
            Public Canary →
          </button>
        </Link>
      </div>

      {/* Status Orb */}
      <div className="mt-12 grid gap-8 lg:grid-cols-2">
        <GlassCard className="fade-in-up-2 p-8" status={statusMode}>
          <div className="text-center">
            <p className="mono-caps mb-6 text-xs" style={{ color: "var(--text-muted)" }}>
              Canary Status
            </p>
            <StatusOrb status={statusMode} />
            <p 
              className="mono-caps mt-6 text-2xl font-semibold"
              style={{ color: statusMode === "safe" ? "var(--safe-green)" : "var(--alert-red)" }}
            >
              {statusMode === "safe" ? "LIFER ACTIVE" : "ALERT FIRED"}
            </p>
            <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
              Last verified: {formatRelative(canary.lastSeenAt)}
            </p>
          </div>
        </GlassCard>

        {/* Stats Grid */}
        <div className="space-y-4">
          <GlassCard className="fade-in-up-3 p-6">
            <p className="mono-caps text-xs" style={{ color: "var(--text-muted)" }}>
              Operative
            </p>
            <p className="mt-2 text-2xl font-semibold text-white">
              @{session.user.username}
            </p>
          </GlassCard>

          <GlassCard className="fade-in-up-4 p-6">
            <p className="mono-caps text-xs" style={{ color: "var(--text-muted)" }}>
              Threshold
            </p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {canary.thresholdDays}d silence triggers alert
            </p>
          </GlassCard>

          <GlassCard className="fade-in-up-5 p-6">
            <p className="mono-caps text-xs" style={{ color: "var(--text-muted)" }}>
              Attestations
            </p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {canary.attestations?.length ?? 0} signed
            </p>
          </GlassCard>
        </div>
      </div>

      {/* Check-in Actions */}
      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <GlassCard className="fade-in-up-6 p-8">
          <p className="mono-caps mb-4 text-xs" style={{ color: "var(--safe-green)" }}>
            Normal Check-in
          </p>
          <p className="mb-6 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Sign an attestation with your normal keypair. Requires biometric or PIN verification.
          </p>
          <button
            disabled={busy !== null}
            onClick={() => createCheckin(false)}
            className="glass-button-primary w-full"
          >
            {busy === "normal" ? "Signing..." : "I'm Safe — Verify Check-in"}
          </button>
        </GlassCard>

        <GlassCard className="fade-in-up-7 p-8">
          <p className="mono-caps mb-4 text-xs" style={{ color: "var(--alert-red)" }}>
            Distress Protocol
          </p>
          <p className="mb-6 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Sign with your distress keypair. Silent alarm fires. Looks normal to observers.
          </p>
          <button
            disabled={busy !== null}
            onClick={() => createCheckin(true)}
            style={{
              background: "var(--alert-red)",
              border: "1px solid var(--alert-red)",
            }}
            className="w-full rounded-lg px-4 py-3 font-semibold text-white transition-all hover:brightness-110 disabled:opacity-70"
          >
            {busy === "distress" ? "Firing distress signal..." : "Send Silent Distress Signal"}
          </button>
        </GlassCard>
      </div>

      {/* Social Detection Simulator */}
      <GlassCard className="fade-in-up-8 mt-6 p-8">
        <p className="mono-caps mb-4 text-xs text-white">
          Two-Layer Verification Simulator
        </p>
        <p className="mb-4 text-sm" style={{ color: "var(--text-muted)" }}>
          {pendingHint}
        </p>
        <div className="flex flex-wrap gap-3">
          <select
            value={selectedPlatform}
            onChange={(event) => setSelectedPlatform(event.target.value as "nostr" | "mastodon" | "bluesky")}
            className="glass-input"
          >
            <option value="nostr">Nostr</option>
            <option value="mastodon">Mastodon</option>
            <option value="bluesky">Bluesky</option>
          </select>
          <button
            onClick={simulatePostDetected}
            disabled={detectBusy}
            className="glass-button"
          >
            {detectBusy ? "Detecting..." : "Simulate Post Detection"}
          </button>
        </div>
      </GlassCard>

      {/* Push Notifications */}
      <GlassCard className="mt-6 p-8">
        <p className="mono-caps mb-4 text-xs text-white">
          Push Alert System
        </p>
        <button
          onClick={enablePushAlerts}
          disabled={pushBusy || pushReady}
          className="glass-button"
        >
          {pushReady ? "✓ Push Alerts Enabled" : pushBusy ? "Enabling..." : "Enable Push Alerts"}
        </button>
      </GlassCard>

      {error ? (
        <div 
          className="mt-6 rounded-lg border p-4"
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

      {/* Latest Attestation */}
      <GlassCard className="mt-12 p-8">
        <h2 className="heading-serif text-3xl text-white">Latest Attestation</h2>
        {!latestAttestation ? (
          <p className="mt-4 text-sm" style={{ color: "var(--text-muted)" }}>
            No attestations signed yet.
          </p>
        ) : (
          <div className="mt-6 space-y-3 font-mono text-sm">
            <div className="flex gap-3">
              <span className="mono-caps w-32 text-xs" style={{ color: "var(--text-muted)" }}>
                Timestamp:
              </span>
              <span style={{ color: "var(--text-primary)" }}>
                {latestAttestation.timestamp}
              </span>
            </div>
            <div className="flex gap-3">
              <span className="mono-caps w-32 text-xs" style={{ color: "var(--text-muted)" }}>
                Mode:
              </span>
              <span 
                style={{ 
                  color: latestAttestation.isDistress ? "var(--alert-red)" : "var(--safe-green)" 
                }}
              >
                {latestAttestation.isDistress ? "Distress" : "Normal"}
              </span>
            </div>
            <div className="flex gap-3">
              <span className="mono-caps w-32 text-xs" style={{ color: "var(--text-muted)" }}>
                Signature:
              </span>
              <span className="break-all" style={{ color: "var(--text-primary)" }}>
                {latestAttestation.signature}
              </span>
            </div>
            <div className="flex gap-3">
              <span className="mono-caps w-32 text-xs" style={{ color: "var(--text-muted)" }}>
                IPFS CID:
              </span>
              <span className="break-all" style={{ color: latestAttestation.ipfsCid ? "var(--safe-green)" : "var(--text-muted)" }}>
                {latestAttestation.ipfsCid ?? "pending upload"}
              </span>
            </div>
          </div>
        )}
      </GlassCard>
    </main>
  );
}
