"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getPublicCanary } from "@/lib/api";
import type { CanaryState } from "@/lib/types";
import { StatusOrb, GlassCard } from "@/components/ui";

function daysSilent(lastSeenAt: string | null): number {
  if (!lastSeenAt) return Number.POSITIVE_INFINITY;
  const elapsed = Date.now() - new Date(lastSeenAt).getTime();
  return Math.floor(elapsed / (1000 * 60 * 60 * 24));
}

export default function PublicCanaryPage() {
  const params = useParams<{ username: string }>();
  const username = params.username;
  const [canary, setCanary] = useState<CanaryState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getPublicCanary(username);
        setCanary(data);
      } catch {
        setCanary(null);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [username]);

  if (loading) {
    return <main className="mx-auto min-h-screen w-full max-w-3xl px-6 py-12" />;
  }

  if (!canary) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-3xl px-6 py-12">
        <Link href="/" className="text-sm text-cyan-300 hover:text-cyan-200">
          ← Home
        </Link>
        <h1 className="mt-4 text-3xl font-semibold">Canary not found</h1>
      </main>
    );
  }

  const silentDays = daysSilent(canary.lastSeenAt);
  const thresholdExceeded = silentDays >= canary.thresholdDays;
  const isAlert = canary.status === "alerted" || thresholdExceeded;
  const latestAttestation = canary.attestations[0] ?? null;

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-6 py-12">
      <Link href="/" className="text-sm text-cyan-300 hover:text-cyan-200">
        ← Home
      </Link>

      <h1 className="mt-4 text-3xl font-semibold">@{canary.username}</h1>

      <div className="flex flex-col items-center justify-center pt-8">
        <StatusOrb status={isAlert ? "alert" : "safe"} className="mb-4" />
        <GlassCard className="w-full p-8 text-center" status={isAlert ? "alert" : "safe"}>
          <p className="mono-caps mb-4 text-xs font-semibold" style={{ color: isAlert ? "var(--alert-red)" : "var(--safe-green)" }}>
            {isAlert ? "PROTOCOL COMPROMISED" : "LIFER OPERATIONAL"}
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
            {canary.lastSeenAt
              ? `Last verified check-in: ${new Date(canary.lastSeenAt).toLocaleString()}`
              : "No verified check-in has been recorded yet."}
          </p>
          <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
            Threshold: {canary.thresholdDays} day(s) silence triggers protocol.
          </p>
        </GlassCard>
      </div>

      <GlassCard className="fade-in-up-2 mt-6 p-6">
        <h2 className="mono-caps mb-4 text-xs font-semibold text-white">Connected platforms</h2>
        <ul className="space-y-3 text-sm" style={{ color: "var(--text-muted)" }}>
          <li className="flex justify-between border-b border-white/5 pb-2">
            <span>Nostr</span>
            <span className="font-mono text-white/80">{canary.accounts.nostr || "—"}</span>
          </li>
          <li className="flex justify-between border-b border-white/5 pb-2">
            <span>Mastodon</span>
            <span className="font-mono text-white/80">{canary.accounts.mastodon || "—"}</span>
          </li>
          <li className="flex justify-between border-b border-white/5 pb-2">
            <span>Bluesky</span>
            <span className="font-mono text-white/80">{canary.accounts.bluesky || "—"}</span>
          </li>
        </ul>
      </GlassCard>

      <GlassCard className="fade-in-up-3 mt-6 p-6">
        <h2 className="mono-caps mb-4 text-xs font-semibold text-white">Latest cryptographical attestation</h2>
        {!latestAttestation ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>No official attestations recorded.</p>
        ) : (
          <div className="space-y-4 text-sm">
            <div className="rounded bg-white/5 p-3 font-mono break-all" style={{ color: "var(--text-muted)" }}>
              {latestAttestation.statement}
            </div>
            <div className="flex flex-col gap-1">
              <span className="mono-caps text-[10px]" style={{ color: "var(--text-muted)" }}>Signature (Ed25519)</span>
              <span className="font-mono text-xs break-all text-white/60">{latestAttestation.signature}</span>
            </div>
          </div>
        )}
      </GlassCard>
    </main>
  );
}
