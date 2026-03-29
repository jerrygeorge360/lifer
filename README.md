# Lifer — Decentralized Dead Man's Switch

> **If you go silent, the truth gets out. Automatically.**

[![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.0-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Nostr](https://img.shields.io/badge/Protocol-Nostr-purple?style=flat-square)](https://nostr.com/)
[![IPFS](https://img.shields.io/badge/Storage-IPFS%20%2F%20Pinata-65C2CB?style=flat-square)](https://pinata.cloud/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
[![Hackathon: PL_Genesis](https://img.shields.io/badge/Hackathon-PL__Genesis-blueviolet?style=flat-square)](https://plgenesis.com)

---

<!-- BANNER IMAGE PLACEHOLDER -->
<!-- Replace with: ![Lifer Banner](./public/banner.png) -->
> 📸 _[Banner image placeholder — add a 1200×630 hero image here]_

---

## Table of Contents

- [What is Lifer?](#what-is-lifer)
- [The Problem](#the-problem)
- [How It Works](#how-it-works)
- [Demo](#demo)
- [Architecture](#architecture)
- [Core Features](#core-features)
- [Supported Protocols](#supported-protocols)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Running for Development](#running-for-development)
- [Hackathon Alignment](#hackathon-alignment)
- [Roadmap](#roadmap)
- [Documentation](#documentation)
- [License](#license)

---

## What is Lifer?

**Lifer** is a decentralized safety alert system built for journalists, activists, and whistleblowers. It functions as a modern **dead man's switch** — monitoring your social media activity in real-time and automatically releasing your "In Case of Emergency" data to trusted subscribers if you go silent beyond a configurable threshold.

Think of it as a cryptographic warrant canary that runs on your social presence. As long as you keep posting, Lifer stays quiet. The moment you stop — it fires.

No central authority controls the trigger. No single server can be seized to suppress it. Your attestations are signed with your own Ed25519 keypair and stored on IPFS.

---

## The Problem

People in high-risk situations — journalists, activists, dissidents, whistleblowers — need a reliable way to ensure that if something happens to them, important information reaches the right people. Current solutions all have the same problem: they rely on a central server, a trusted person, or a scheduled email that can be cancelled, seized, or suppressed.

Lifer removes that single point of failure. The trigger is your social media silence. The storage is IPFS. The alert is automated and multi-channel. No human, no server, and no authority can unilaterally stop it once it is armed.

---

## How It Works

**Three layers working together:**

**1. Social Monitoring (Proof of Life)**
Lifer monitors your Nostr activity in real-time across multiple relays. As long as you post, the countdown resets. If you exceed your silence threshold, the alert pipeline fires.

**2. Cryptographic Check-ins (Two-Layer)**
Beyond passive social monitoring, you can actively check in with a two-layer attestation: a social post plus a biometric WebAuthn signature (passkey). Each check-in produces a signed Ed25519 attestation uploaded to IPFS as a content-addressed object.

**3. Distress Signals**
If you are under duress, you can trigger a silent alarm using a secret **Duress PIN** or a dedicated **Distress Keypair** — sending a signal to your trusted network without alerting whoever is watching you.

---

## Demo

<!-- DEMO VIDEO PLACEHOLDER -->
<!-- Replace with: [![Watch Demo](./public/demo-thumbnail.png)](https://youtube.com/your-demo-link) -->
> 🎬 _[Demo video placeholder — embed your YouTube demo link here]_  
> `[![Watch the Demo](https://img.youtube.com/vi/YOUR_VIDEO_ID/maxresdefault.jpg)](https://youtube.com/watch?v=YOUR_VIDEO_ID)`

<!-- DASHBOARD SCREENSHOT PLACEHOLDER -->
<!-- Replace with: ![Dashboard](./public/screenshot-dashboard.png) -->
> 📸 _[Dashboard screenshot placeholder]_

<!-- CANARY PAGE SCREENSHOT PLACEHOLDER -->
<!-- Replace with: ![Public Canary Page](./public/screenshot-canary.png) -->
> 📸 _[Public canary page screenshot placeholder — /canary/[username]]_

**Live Demo:** _[Add your deployed URL here]_

---

## Architecture

### System Overview

![System Overview](./assets/Full-stack%20web%20application%20architecture%20diagram.png)

### Check-in Flow

![Check-in Flow](./assets/ChatGPT%20Image%20Mar%2029,%202026,%2011_14_09%20PM.png)

### Alert Pipeline

![Alert Pipeline](./assets/Alert%20pipeline%20monitoring%20flowchart.png)

### Distress Signal Model

![Distress Signal Model](./assets/System%20distress%20signal%20flowchart.png)

---

## Core Features

| Feature | Description |
|---|---|
| **Real-time Nostr Monitoring** | Connects to multiple Nostr relays via `nostr-tools` to watch for social activity 24/7 |
| **Two-Layer Check-ins** | Social post + WebAuthn biometric passkey signature for the strongest proof of life |
| **Ed25519 Keypair** | Browser-generated Ed25519 keypair signs every attestation — your key, your control |
| **IPFS Attestation Storage** | Signed check-in objects uploaded to IPFS via Pinata with CID stored on-chain in PostgreSQL |
| **Distress PIN** | A secret PIN that looks like a normal login but silently triggers your alert pipeline |
| **Distress Keypair** | A dedicated alternate key that fires an immediate silent alarm when used |
| **Multi-Channel Alerts** | Email (Resend), Telegram Bot, and Web Push browser notifications for subscribers |
| **Public Canary Page** | A public `/canary/[username]` page showing your last verified check-in status |
| **Background Workers** | BullMQ workers on Redis handle threshold checks (hourly) and Bluesky polling (every 30 min) |
| **PWA + Web Push** | Installable Progressive Web App with push notification support for check-in reminders |
| **Encrypted Key Backup** | Keypair export as an encrypted backup file for recovery |
| **External DB Support** | Works with cloud databases (Neon, Supabase) or local Docker PostgreSQL |

---

## Supported Protocols

| Protocol | Status | Method |
|---|---|---|
| **Nostr** | ✅ Live | Real-time relay subscription via `nostr-tools` |
| **Bluesky** | 🔜 Coming Soon | BullMQ polling worker (every 30 min) |
| **Mastodon** | 🔜 Coming Soon | Webhook ingestion via API routes |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js `16.1.6` · React `19.2.0` · TypeScript `5` |
| **Styling** | Tailwind CSS `4.1.0` (Glassmorphism) · Shadcn UI |
| **3D / Visuals** | Three.js `0.183.2` · React Three Fiber |
| **Database** | PostgreSQL · Prisma ORM `7.4.0` · `@prisma/adapter-pg` |
| **Job Queue** | BullMQ `5.70.4` · ioredis `5.10.0` · Redis |
| **Nostr** | `nostr-tools 2.23.3` |
| **Cryptography** | Web Crypto API (Ed25519) · WebAuthn / Passkeys (`@simplewebauthn` v13) |
| **IPFS Storage** | Pinata SDK `2.5.5` · `multiformats` · `@ipld/dag-json` (local CID fallback) |
| **Email Alerts** | Resend (`RESEND_API_KEY`) |
| **Telegram Alerts** | Telegram Bot API (`TELEGRAM_BOT_TOKEN`) |
| **Push Notifications** | `web-push 3.6.7` · VAPID keypair |
| **Validation** | Zod `4.3.6` |
| **PWA** | `next-pwa 5.6.0` · Service Worker |
| **Infrastructure** | Docker Compose · PostgreSQL · Redis |
| **Runner** | `tsx 4.20.5` (for scripts/workers) |

---

## Project Structure

```
lifer/
├── app/
│   ├── api/                    # Next.js API routes (auth, setup, checkin, WebAuthn, push)
│   ├── canary/[username]/      # Public canary status page
│   ├── dashboard/              # User dashboard
│   ├── register/               # Registration flow
│   └── setup/                  # Security + threshold setup
├── components/
│   └── ui/                     # Shadcn UI components
├── lib/                        # Shared utilities (crypto, IPFS adapter, alert fanout)
├── prisma/
│   └── schema.prisma           # Database schema
├── public/                     # Static assets + PWA manifest
├── scripts/
│   ├── infra.ts                # Smart infra launcher (avoids port conflicts)
│   └── workers.ts              # BullMQ worker process entry point
├── .env.example                # Environment variable template
├── .env.enc                    # Encrypted env backup
├── .env.local.enc              # Encrypted local env backup
├── docker-compose.yml          # PostgreSQL + Redis services
├── next.config.ts              # Next.js config
├── prisma.config.ts            # Prisma config
├── copilot-instructions.md     # Detailed architectural guide
├── NEXT_STEPS.md               # Implementation history + execution backlog
└── TODO.md                     # Remaining tasks
```

---

## Quick Start

### Prerequisites

- Node.js **18+**
- Docker & Docker Compose
- Redis 6.2+ (or let Docker manage it)

### 1. Clone and install

```bash
git clone https://github.com/jerrygeorge360/lifer.git
cd lifer
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
# Fill in your secrets — see Environment Variables section below
```

### 3. Spin up infrastructure

The `infra` script intelligently detects whether PostgreSQL and Redis are already running on your host — it only spins up Docker containers for services that are missing:

```bash
npm run infra
```

### 4. Run database migrations

```bash
npx prisma migrate dev
npx prisma generate
```

### 5. Start the application

In one terminal:
```bash
npm run dev
```

In a second terminal:
```bash
npm run workers
```

The app runs at `http://localhost:3000`. The canary page for any user is at `/canary/[username]`.

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

```bash
# Database (local Docker or cloud — e.g. Neon, Supabase)
DATABASE_URL=

# Redis (local Docker or cloud)
REDIS_URL=

# Pinata (IPFS storage for signed attestations)
PINATA_JWT=

# Resend (email alert delivery)
RESEND_API_KEY=

# Telegram (bot alert delivery)
TELEGRAM_BOT_TOKEN=

# Web Push (VAPID keypair for browser notifications)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=

# App
NEXT_PUBLIC_APP_URL=
```

### Using an External Cloud Database (e.g. Neon)

1. Set `DATABASE_URL` to your cloud connection string in `.env.local`
2. Run `npx prisma migrate deploy` to apply the schema
3. Run `npm run infra` — it auto-detects the external URL and only starts Redis locally

### Optional: Data Browser

```bash
npx prisma studio
```

---

## Running for Development

For a fully local setup running each component separately:

| Terminal | Command | Purpose |
|---|---|---|
| 1 | `npm run infra` | Start PostgreSQL + Redis (Docker, skips existing services) |
| 2 | `npm run dev` | Next.js web server |
| 3 | `npm run workers` | BullMQ background workers (threshold checks + Bluesky polling) |
| 4 | `npx prisma studio` | Visual data browser |

---

## Hackathon Alignment

### Protocol Labs — Infrastructure & Digital Rights

Lifer directly implements one of the Protocol Labs Infrastructure & Digital Rights example use cases:

> *"Dead man's switch for digital inheritance and secure key transfer"*

The project addresses all four judging criteria for this track:

**Innovation / Creativity** — Links real-time decentralized social activity (Nostr) to cryptographic attestations stored on IPFS, creating a passive proof-of-life system that requires no manual heartbeat. The Duress PIN and Distress Keypair add a covert signal layer that has no equivalent in existing safety tools.

**Impact / Usefulness** — Journalists, activists, and whistleblowers operating in high-risk environments have a genuine, unmet need for a suppression-resistant dead man's switch. Existing tools (scheduled emails, paid services) rely on centralized servers that can be seized or cancelled. Lifer removes that attack surface.

**Relevance to Theme** — Data ownership, decentralized storage (IPFS), censorship-resistant communication (Nostr), and privacy-preserving personal safety — this is the Infrastructure & Digital Rights track's core brief.

**Use of Sponsor Tech** — IPFS via Pinata is the primary storage layer for all signed attestations. Every check-in produces an IPFS content address that is the tamper-evident, censorship-resistant record of the user's safety at that moment.

### Protocol Labs — Crypto Track (Secondary)

Lifer also aligns with the Crypto track's public goods and coordination angle — a self-sovereign safety infrastructure for people who cannot rely on institutional protection.

### Fresh Code

This is a **fresh code** submission built specifically for PL_Genesis.

---

## Roadmap

The following is drawn from `NEXT_STEPS.md` and `TODO.md`:

**Production hardening:**
- [ ] End-to-end flow validation (register → setup → passkey enrollment → social detection → normal + distress check-in)
- [ ] Full API integration tests for auth, setup, check-in, and WebAuthn routes
- [ ] Worker validation: hourly threshold checks + 30-minute Bluesky polling confirmed running
- [ ] Deployment runbook for app + workers

**Protocol expansion:**
- [ ] Mastodon webhook ingestion (API route ready, integration pending)
- [ ] Bluesky polling worker (BullMQ scaffolding in place)
- [ ] Multi-relay Nostr failover with health monitoring

**User experience:**
- [ ] Subscriber management UI (add, remove, notify contacts)
- [ ] Threshold configuration UI (silence window, escalation stages)
- [ ] Key rotation and passkey re-enrollment
- [ ] Mobile-first PWA polish

**Decentralization:**
- [ ] Filecoin long-term archival of attestation objects
- [ ] On-chain canary status anchoring
- [ ] Remove remaining centralised components (session → token-based, DB → hybrid IPFS index)

---

## Documentation

| File | Purpose |
|---|---|
| `README.md` | Project overview and setup (this file) |
| `TODO.md` | Remaining tasks and open items |
| `NEXT_STEPS.md` | Implemented feature history and execution backlog |
| `copilot-instructions.md` | Detailed technical architectural guide |

---

## License

MIT © 2025 — [jerrygeorge360](https://github.com/jerrygeorge360/lifer)