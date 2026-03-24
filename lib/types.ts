export type CanaryStatus = "active" | "alerted" | "snoozed";

export type Platform = "nostr" | "mastodon" | "bluesky";

export interface RegistrationState {
  userId?: string;
  username: string;
  email: string;
  did: string;
  publicKeyMain: JsonWebKey;
  publicKeyDistress: JsonWebKey;
  privateKeyMain: JsonWebKey;
  privateKeyDistress: JsonWebKey;
  createdAt: string;
}

export interface SetupState {
  thresholdDays: number;
  realPin: string;
  duressPin: string;
  accounts: Partial<Record<Platform, string>>;
}

export interface AttestationRecord {
  id: string;
  username: string;
  did: string;
  timestamp: string;
  statement: string;
  isDistress: boolean;
  signature: string;
  ipfsCid?: string;
}

export interface CanaryState {
  id?: string;
  username: string;
  thresholdDays: number;
  status: CanaryStatus;
  lastSeenAt: string | null;
  accounts: Partial<Record<Platform, string>>;
  attestations: AttestationRecord[];
}

export interface SessionUser {
  id: string;
  username: string;
  email: string;
  did: string;
  hasWebAuthn: boolean;
}
