import type { CanaryState, SessionUser } from "@/lib/types";

export interface SessionPayload {
  user: SessionUser;
  canary: CanaryState;
}

async function toJson<T>(response: Response): Promise<T> {
  const data = await response.json();
  if (!response.ok) {
    throw new Error((data as { error?: string }).error ?? "Request failed.");
  }
  return data as T;
}

export async function getSession(): Promise<SessionPayload | null> {
  const response = await fetch("/api/auth/me", { cache: "no-store" });
  if (response.status === 401) return null;
  const data = await toJson<{
    user: SessionUser;
    canary: {
      id: string;
      username: string;
      thresholdDays: number;
      status: "active" | "alerted" | "snoozed";
      lastSeenAt: string | null;
      accounts: Array<{ platform: "nostr" | "mastodon" | "bluesky"; handle: string }>;
      attestations: Array<{
        id: string;
        payload: { username: string; did: string; timestamp: string; statement: string; isDistress: boolean };
        signature: string;
        ipfsCid: string;
      }>;
    };
  }>(response);

  return {
    user: data.user,
    canary: {
      id: data.canary.id,
      username: data.canary.username,
      thresholdDays: data.canary.thresholdDays,
      status: data.canary.status,
      lastSeenAt: data.canary.lastSeenAt,
      accounts: {
        nostr: data.canary.accounts.find((a) => a.platform === "nostr")?.handle,
        mastodon: data.canary.accounts.find((a) => a.platform === "mastodon")?.handle,
        bluesky: data.canary.accounts.find((a) => a.platform === "bluesky")?.handle,
      },
      attestations: data.canary.attestations.map((item) => ({
        id: item.id,
        username: item.payload.username,
        did: item.payload.did,
        timestamp: item.payload.timestamp,
        statement: item.payload.statement,
        isDistress: item.payload.isDistress,
        signature: item.signature,
        ipfsCid: item.ipfsCid,
      })),
    },
  };
}

export async function getPublicCanary(username: string): Promise<CanaryState> {
  const response = await fetch(`/api/canary/${encodeURIComponent(username)}`, { cache: "no-store" });
  const data = await toJson<{
    canary: {
      id: string;
      username: string;
      thresholdDays: number;
      status: "active" | "alerted" | "snoozed";
      lastSeenAt: string | null;
      accounts: Array<{ platform: "nostr" | "mastodon" | "bluesky"; handle: string }>;
      attestations: Array<{
        id: string;
        payload: { username: string; did: string; timestamp: string; statement: string; isDistress: boolean };
        signature: string;
        ipfsCid: string;
      }>;
    };
  }>(response);

  return {
    id: data.canary.id,
    username: data.canary.username,
    thresholdDays: data.canary.thresholdDays,
    status: data.canary.status,
    lastSeenAt: data.canary.lastSeenAt,
    accounts: {
      nostr: data.canary.accounts.find((a) => a.platform === "nostr")?.handle,
      mastodon: data.canary.accounts.find((a) => a.platform === "mastodon")?.handle,
      bluesky: data.canary.accounts.find((a) => a.platform === "bluesky")?.handle,
    },
    attestations: data.canary.attestations.map((item) => ({
      id: item.id,
      username: item.payload.username,
      did: item.payload.did,
      timestamp: item.payload.timestamp,
      statement: item.payload.statement,
      isDistress: item.payload.isDistress,
      signature: item.signature,
      ipfsCid: item.ipfsCid,
    })),
  };
}

export async function postJson<T>(url: string, body: object): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return toJson<T>(response);
}
