# Lifer Development TODO List

This document outlines the remaining tasks for completing the Lifer decentralized safety system.

## Infrastructure & Core Setup
- [x] **Local Environment:** Database (PostgreSQL) and Redis are running (see `docker-compose.yml`).
- [x] **Database Schema:** Initial Prisma migrations are applied.
- [x] **Secrets Audit:** Ensure all sensitive tokens in `.env.local` are valid and not committed.

## Security & Cryptography
- [ ] **Dual-Key Validation:** Verify client-side generation and signing with both the **Main Keypair** and **Distress Keypair**.
- [ ] **Duress Mechanism:** Implement and test the **Duress PIN** logic (should fire a silent distress alert whilst appearing as a normal login).
- [ ] **Passkey (WebAuthn) Flow:** Confirm biometric registration and assertion are fully functional across different browsers.
- [ ] **IPFS Persistence:** Verify that attestations are being correctly pinned to Pinata and are publicly accessible via CID.

## Social Monitoring & Check-ins
- [x] **Nostr Relay Integration:** Real-time detection via `nos.lol`, `damus.io`, etc.
- [ ] **Push Notification Logic:** Confirm that the browser receives and displays check-in prompts correctly via Web Push.

## Future Roadmap (Coming Soon)
- [ ] **Bluesky Polling:** Implement BullMQ workers to poll Bluesky posts.
- [ ] **Mastodon Webhooks:** Implement activity detection for Mastodon accounts.

## Alerting & Fanout
- [ ] **Channel Verification:**
    - [ ] Real-world test of **Resend** email alerts.(Please use resend.com it is easy to setup and use and free)
    - [ ] Real-world test of **Telegram Bot** alert delivery to actual Telegram IDs.(Ask me for my telegram token)
- [ ] **Silence Threshold Logic:** Manually simulate a user going silent beyond their threshold and verify the automatic alert firing.
- [ ] **Snooze Logic:** Ensure `snoozeUntil` works and is cryptographically signed to prevent unauthorized suppression of alerts.

## UI/UX & PWA(go here:https://whatpwacando.today/)
- [x] **Glassmorphic Design Polish:** Ensure all screens match the "Dark Glass Luxury" aesthetic defined in `copilot-instructions.md`.
- [x] **Interactive 3D Elements:** Add the Three.js status globe or pulse animations for safe/alert states.
- [x] **PWA Manifest:** Verify `manifest.json` and service worker (`sw.js`) for full "installability".

## Testing & Readiness(later I will do that)
- [ ] **API Functional Tests:** Create unit/integration tests for critical routes in `app/api/`.
- [ ] **Demo Mode:** Create a set of scripts to easily simulate "Social Post", "Check-in", and "Silence Alert" for demo purposes.
- [ ] **Deployment Prep:** Finalize the runbook for deploying to Vercel (Frontend) and Railway (Backend/Workers).
I will likely use github action to deploy to a azure
