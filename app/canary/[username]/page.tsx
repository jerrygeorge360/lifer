"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getPublicCanary } from "@/lib/api";
import type { CanaryState } from "@/lib/types";

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

      <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/60 p-6">
        <p className={`text-2xl font-semibold ${isAlert ? "text-rose-300" : "text-emerald-300"}`}>
          {isAlert ? "🔴 ALERT" : "🟢 LIFER ACTIVE"}
        </p>
        <p className="mt-3 text-sm text-slate-300">
          {canary.lastSeenAt
            ? `Last verified check-in: ${new Date(canary.lastSeenAt).toLocaleString()}`
            : "No verified check-in has been recorded yet."}
        </p>
        <p className="mt-2 text-sm text-slate-300">Threshold: {canary.thresholdDays} day(s)</p>
      </div>

      <section className="mt-6 rounded-xl border border-slate-800 bg-slate-950/60 p-6">
        <h2 className="text-lg font-semibold">Connected accounts</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-300">
          <li>Nostr: {canary.accounts.nostr || "—"}</li>
          <li>Mastodon: {canary.accounts.mastodon || "—"}</li>
          <li>Bluesky: {canary.accounts.bluesky || "—"}</li>
        </ul>
      </section>

      <section className="mt-6 rounded-xl border border-slate-800 bg-slate-950/60 p-6">
        <h2 className="text-lg font-semibold">Latest attestation</h2>
        {!latestAttestation ? (
          <p className="mt-2 text-sm text-slate-300">No attestations yet.</p>
        ) : (
          <div className="mt-3 space-y-1 text-sm text-slate-200">
            <p>{latestAttestation.timestamp}</p>
            <p>{latestAttestation.statement}</p>
            <p className="break-all text-slate-400">sig: {latestAttestation.signature}</p>
          </div>
        )}
      </section>
    </main>
  );
}
