# Lifer — Next Steps TODO

## Implemented in this pass

- [x] Day 1 foundation screens
  - [x] Registration flow at `/register`
  - [x] Security + threshold setup at `/setup`
  - [x] User dashboard at `/dashboard`
  - [x] Public canary page at `/canary/[username]`
- [x] Browser key utilities
  - [x] Keypair generation (Ed25519)
  - [x] Attestation signing helper
  - [x] Encrypted backup file export helper
- [x] Local persistence layer
  - [x] Registration/session state
  - [x] Setup draft + local key material
- [x] Landing page navigation for all flows

## Next implementation backlog

- [x] Replace prototype signing with production Ed25519 flow
- [x] Add server persistence with Prisma + PostgreSQL
- [x] Add WebAuthn registration + assertion verification
- [x] Add Nostr/Mastodon/Bluesky ingestion workers
- [x] Add push notifications for two-layer check-in prompts
- [x] Add IPFS storage for signed attestation objects
- [x] Add email + Telegram alert fanout for subscribers

## Added now

- [x] Prisma-backed auth/session API routes
- [x] Setup + canary + check-in route handlers
- [x] Signature verification server-side before attestation acceptance
- [x] IPFS upload adapter with local-CID fallback
- [x] Alert creation + subscriber email/Telegram fanout
- [x] Push subscription endpoint + browser subscription flow
- [x] BullMQ worker scaffolding for threshold and social checks

## Next execution steps

- [x] Unblock database migration
  - [x] Set valid `DATABASE_URL` in `.env.local`
  - [x] Run `prisma migrate dev`
  - [x] Regenerate Prisma client and validate tables exist

- [x] Remove migration/config workaround
  - [x] Clean up `prisma.config.ts` temporary compatibility settings
  - [x] Keep strict typed config only

- [ ] Validate end-to-end safety flows
  - [ ] Register account
  - [ ] Complete setup + passkey enrollment
  - [ ] Simulate social post detection
  - [ ] Complete normal check-in (two-layer)
  - [ ] Trigger distress check-in and verify alert fanout

- [ ] Validate workers and alert scheduling
  - [ ] Start workers process
  - [ ] Confirm threshold checks run hourly
  - [ ] Confirm Bluesky polling schedule runs every 30 minutes

- [ ] Production readiness pass
  - [ ] Verify all secrets/tokens in `.env.local`
  - [ ] Add API integration tests for auth/setup/check-in/WebAuthn routes
  - [ ] Add deployment runbook for app + workers
