# Copilot Instructions — Lifer

## What This Project Is

Lifer is a decentralized safety alert system for journalists, activists, and whistleblowers.

Users connect their social media accounts (Nostr, Mastodon, Bluesky). When they post on any connected platform, Lifer sends them a push notification asking them to confirm it was really them using Face ID, fingerprint, or PIN. This confirmation creates a cryptographically signed attestation stored on IPFS.

If a user goes silent beyond their chosen threshold — or if their device is locked after failed attempts — subscribers are automatically notified via email or Telegram.

The name Lifer means two things: committed to life, and committed to staying visible.

This project was built for the Protocol Labs Infrastructure & Digital Rights hackathon track.

---

## Core Concepts

- **Lifer** — the app. A Progressive Web App (PWA) built with Next.js. Installable on any phone without an App Store.
- **Canary** — a user's public safety profile. Contains their connected accounts, silence threshold, and public key.
- **Attestation** — a signed JSON object posted to IPFS proving the user confirmed they are okay at a specific timestamp.
- **Threshold** — the number of days of silence before an alert fires. Set by the user.
- **Two-layer check-in** — a valid check-in requires BOTH a social media post AND biometric/PIN confirmation. One without the other is ignored.
- **Distress keypair** — a secondary keypair the user can use to silently signal danger. Looks identical to a normal attestation from the outside.
- **Duress PIN** — a second PIN that looks like a normal login but secretly fires a distress alert immediately.
- **Subscriber** — anyone who follows a canary and receives alerts when it fires.
- **Alert** — a notification sent to all subscribers when silence exceeds threshold, device is locked after failed attempts, or a distress signal is detected.

---

## Complete User Flow

### Registration
```
User visits lifer.io
        ↓
Clicks "Protect Yourself"
        ↓
Enters username, email, password
        ↓
App generates two keypairs in Web Crypto keystore:
- Main keypair → normal attestations
- Distress keypair → emergency signals
        ↓
Private keys never leave the browser
Server only stores public keys
        ↓
User downloads encrypted backup of both keys
"Store this somewhere safe. We cannot recover it."
```

### Security Setup
```
User sets up authentication:
- Face ID / Fingerprint via WebAuthn
- Real PIN → normal operation
- Duress PIN → looks normal, secretly fires distress alert
        ↓
User sets silence threshold:
"Alert subscribers if I go silent for X days"
        ↓
User connects social accounts:
- Nostr (priority 1)
- Mastodon (priority 2)
- Bluesky (priority 3)
```

### Normal Daily Life
```
User posts anything on Mastodon / Nostr / Bluesky
        ↓
Lifer detects the post via:
- Nostr relay subscription (instant)
- Mastodon webhook (instant)
- Bluesky polling every 30 mins
        ↓
Lifer sends push notification to user's phone:
"You just posted on Mastodon — confirm it was you"
        ↓
User taps notification
App opens, requests Face ID or real PIN
        ↓
Web Crypto keystore signs attestation internally
Private key never exposed to JavaScript
        ↓
Signed attestation uploaded to IPFS
        ↓
Public canary page updates:
Last verified: just now
        ↓
Subscribers hear nothing. Life goes on.
```

### Phone Gets Stolen
```
Thief opens Lifer app
        ↓
App requests Face ID
Thief's face doesn't match
        ↓
App requests PIN
Thief doesn't know it
        ↓
3 failed attempts
        ↓
App locks completely
Alert fires immediately
Subscribers notified:
"Device locked after failed attempts"
```

### User Is Forced To Unlock
```
Authorities force user to open app
        ↓
User enters DURESS PIN
        ↓
App appears completely normal
Nothing looks different to the authorities
        ↓
Behind the scenes:
Distress keypair signs silently
Alert fires immediately
        ↓
[Distress] Subscribers notified:
"Distress signal detected"
```

### Thief Posts On Social Media
```
Thief steals phone
Thief opens Mastodon and posts
        ↓
Lifer detects the post
Sends push notification to phone
        ↓
App requests Face ID
Thief's face doesn't match
        ↓
Signing never happens
Post is completely ignored
Clock keeps ticking
Alert eventually fires
```

### Silence Alert
```
User stops posting
        ↓
Lifer checks every hour
        ↓
Threshold crossed
        ↓
Alert fires automatically
        ↓
Every subscriber gets:
Email + Telegram:
"[Username] has been silent for 3 days.
Last seen: October 2nd."
        ↓
Public page turns red:
ALERT — Silent for 3 days
```

### User Returns Safely
```
User opens app
Face ID confirmed
        ↓
Taps "I'm okay — resume canary"
        ↓
Signed attestation posted to IPFS
Canary resumed
Subscribers notified:
"[Username] has checked back in safely"
```

---

## Security Model

| Threat | Protection |
|---|---|
| Phone stolen | Biometrics + PIN required to sign |
| Forced to unlock | Duress PIN fires silent alarm |
| 3 wrong attempts | Instant alert fires |
| Thief posts on social media | Signature required — post ignored without it |
| Fake account posting | Ed25519 signature verification |
| Server gets hacked | Private keys never on server |
| Key extraction from browser | Web Crypto secure enclave — key cannot be extracted |
| Coerced to look normal | Distress attestation is indistinguishable from normal |

---

## Tech Stack

### Frontend
- **Next.js 14** (App Router)
- **Tailwind CSS** for styling
- **shadcn/ui** for components
- **next-pwa** for Progressive Web App — installable on phone without App Store
- **@simplewebauthn/browser** for Face ID / fingerprint via WebAuthn

### Backend
- **Next.js 14** API routes (backed by Prisma)
- **PostgreSQL 15** (managed via Docker locally)
- **BullMQ + Redis** for scheduled monitoring jobs
- **Prisma** as ORM
- **tsx** for running background worker scripts

### Decentralized Storage
- **IPFS** — where signed attestations are stored permanently
- **Pinata** — the service used to pin attestations to IPFS (free tier, no credit card)
- **pinata SDK** — `npm install pinata`
- Authentication uses JWT only — ignore API Key and Secret from dashboard

### Cryptography
- **Web Crypto API** (browser built-in) — secure keypair storage and signing
- **@noble/ed25519** — Ed25519 signing library
- **@simplewebauthn/server** — server-side WebAuthn verification
- **did-key** — wraps keypairs into Decentralized Identifiers (DIDs)

### Social Media Monitoring
| Platform | Method | Priority |
|---|---|---|
| Nostr | Relay subscription (instant) | 1st |
| Mastodon | Webhook (instant) | 2nd |
| Bluesky | Polling every 30 mins | 3rd |

### Notifications
- **Resend** — email alerts to subscribers
- **Telegram Bot API** — instant Telegram alerts
- **Web Push** — push notifications to user's PWA

### Deployment
- **Vercel** — frontend & API routes
- **Docker** — Local database orchestration
- **Railway** — Production database, Redis, and workers

---

## Current Infrastructure & Development Mode

### Local Development
- **Database:** PostgreSQL runs inside Docker (`docker-compose up -d`).
- **Redis:** Uses a system-level Redis instance (at `127.0.0.1:6379`). NOTE: BullMQ recommends version 6.2.0 or higher.
- **Workers:** Background jobs are started separately via `npm run workers`.
- **Environment:** All local secrets and connection strings are managed in `.env.local`.

### Source of Truth
- **`README.md`**: Project overview and quick start.
- **`TODO.md`**: Live task list for feature completion.
- **`NEXT_STEPS.md`**: Historical log of implemented features and previous execution steps.
- **`walkthrough.md`**: Record of the initial environment setup and verification.

---

## Folder Structure

```
lifer/
├── apps/
│   ├── web/                        # Next.js PWA frontend
│   │   ├── app/
│   │   │   ├── page.tsx                    # Landing page
│   │   │   ├── register/                   # Registration flow
│   │   │   ├── setup/                      # Security + threshold setup
│   │   │   ├── dashboard/                  # User dashboard
│   │   │   ├── canary/[username]/          # Public canary page
│   │   │   └── subscribe/[username]/       # Subscribe to a canary
│   │   ├── components/
│   │   │   ├── CanaryStatus.tsx            # status badge
│   │   │   ├── AlertFeed.tsx               # Alert history
│   │   │   ├── SubscribeForm.tsx           # Email/Telegram subscribe
│   │   │   ├── CheckInPrompt.tsx           # Push notification confirmation UI
│   │   │   └── KeyBackup.tsx               # Key download component
│   │   ├── lib/
│   │   │   ├── crypto.ts                   # Web Crypto keypair generation + signing
│   │   │   ├── webauthn.ts                 # Face ID / fingerprint helpers
│   │   │   └── storage.ts                  # Key backup helpers
│   │   └── public/
│   │       ├── manifest.json               # PWA manifest
│   │       └── sw.js                       # Service worker
│   │
│   └── api/                        # Express backend
│       ├── routes/
│       │   ├── canary.ts                   # CRUD for canaries
│       │   ├── subscribe.ts                # Subscription management
│       │   ├── alerts.ts                   # Alert history
│       │   └── checkin.ts                  # Receive and verify attestations
│       ├── jobs/
│       │   ├── monitorNostr.ts             # Nostr relay subscription
│       │   ├── monitorMastodon.ts          # Mastodon webhook handler
│       │   ├── monitorBluesky.ts           # Bluesky polling job
│       │   └── checkThresholds.ts          # Fires alerts when silence exceeded
│       ├── services/
│       │   ├── ipfs.ts                     # Pinata upload/fetch to IPFS
│       │   ├── verify.ts                   # Ed25519 signature verification
│       │   ├── notify.ts                   # Email + Telegram alert sending
│       │   ├── webpush.ts                  # Push notification sender
│       │   └── did.ts                      # DID generation
│       └── prisma/
│           └── schema.prisma
│
└── packages/
    └── shared/                     # Shared types and utils
```

---

## Database Schema (Prisma)

```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  username      String   @unique
  passwordHash  String
  publicKey     String   # Ed25519 main public key (hex)
  distressKey   String   # Ed25519 distress public key (hex)
  did           String   # Decentralized Identifier
  webAuthnId    String?  # WebAuthn credential ID
  createdAt     DateTime @default(now())
  canary        Canary?
}

model Canary {
  id              String          @id @default(cuid())
  username        String          @unique
  userId          String          @unique
  user            User            @relation(fields: [userId], references: [id])
  thresholdDays   Int
  snoozedUntil    DateTime?
  lastSeenAt      DateTime?
  status          String          @default("active") # active | alerted | snoozed
  accounts        SocialAccount[]
  subscribers     Subscriber[]
  attestations    Attestation[]
  alerts          Alert[]
}

model SocialAccount {
  id          String  @id @default(cuid())
  canaryId    String
  canary      Canary  @relation(fields: [canaryId], references: [id])
  platform    String  # nostr | mastodon | bluesky
  handle      String
  platformId  String
}

model Subscriber {
  id          String   @id @default(cuid())
  canaryId    String
  canary      Canary   @relation(fields: [canaryId], references: [id])
  email       String?
  telegramId  String?
  createdAt   DateTime @default(now())
}

model Attestation {
  id          String   @id @default(cuid())
  canaryId    String
  canary      Canary   @relation(fields: [canaryId], references: [id])
  ipfsCid     String
  signature   String
  timestamp   DateTime
  isDistress  Boolean  @default(false)
}

model Alert {
  id          String   @id @default(cuid())
  canaryId    String
  canary      Canary   @relation(fields: [canaryId], references: [id])
  reason      String   # silence | device_locked | distress
  firedAt     DateTime @default(now())
  notified    Int      @default(0)
}
```

---

## Alert Logic

```typescript
// checkThresholds.ts — runs every hour as a Bull job

async function checkAllCanaries() {
  const canaries = await prisma.canary.findMany({
    where: { status: "active", snoozedUntil: null }
  });

  for (const canary of canaries) {
    const hoursSilent = getHoursSince(canary.lastSeenAt);
    const thresholdHours = canary.thresholdDays * 24;

    if (hoursSilent >= thresholdHours) {
      await fireAlert(canary, "silence");
    }
  }
}

async function fireAlert(canary, reason) {
  // 1. Create alert record in database
  // 2. Fetch all subscribers
  // 3. Send email via Resend
  // 4. Send Telegram message via Bot API
  // 5. Update canary status to "alerted"
  // 6. Post alert attestation to IPFS
}
```

Three triggers that fire an alert:
1. silence — hours silent >= threshold hours
2. device_locked — 3 failed biometric/PIN attempts
3. distress — distress keypair used to sign an attestation

---

## Attestation Format (stored on IPFS)

```json
{
  "version": "1.0",
  "type": "canary_attestation",
  "did": "did:key:z6Mk...",
  "username": "jamal",
  "timestamp": "2024-10-01T09:00:00Z",
  "statement": "I am okay. I have not been coerced. This message is signed freely.",
  "isDistress": false,
  "signature": "abc123..."
}
```

---

## Pinata IPFS Service

```typescript
// apps/api/services/ipfs.ts
import { PinataSDK } from "pinata";

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
});

export async function uploadAttestation(attestation: object): Promise<string> {
  const blob = new Blob(
    [JSON.stringify(attestation)],
    { type: "application/json" }
  );

  const file = new File([blob], "attestation.json");
  const response = await pinata.upload.public.file(file);

  // Returns CID — save this to your database
  return response.cid;
}

export async function getAttestation(cid: string) {
  const response = await pinata.gateways.public.get(cid);
  return response;
}
```

Anyone can publicly verify any attestation at:
```
https://ipfs.io/ipfs/[cid]
```

---

## Two-Layer Check-in Logic

A valid check-in requires both layers:

```typescript
// Layer 1: Social media post detected
// Layer 2: User confirms with biometrics/PIN

async function handlePostDetected(canaryId: string, platform: string) {
  // Send push notification to user
  await sendPushNotification(canaryId, {
    title: `You just posted on ${platform}`,
    body: "Tap to confirm it was you"
  });

  // Wait for confirmation (expires in 2 hours)
  await createPendingCheckin(canaryId, platform);
}

async function handleCheckinConfirmed(canaryId: string, signature: string) {
  // Verify signature came from real keypair
  const isValid = await verifySignature(canaryId, signature);
  if (!isValid) return;

  // Upload attestation to IPFS
  const cid = await uploadAttestation(canaryId, signature);

  // Reset the clock
  await prisma.canary.update({
    where: { id: canaryId },
    data: { lastSeenAt: new Date() }
  });
}
```

---

## Public Canary Page

Every user gets a public page at `/canary/[username]`:

When safe:
```
Lifer Active
Last verified: 6 hours ago
Threshold: 3 days
Platforms: Nostr, Mastodon
Subscribers: 847

[Subscribe via Email] [Subscribe via Telegram]

Attestation History:
Oct 1 09:00 — Verified (IPFS: bafyrei...)
Sep 29 14:23 — Verified (IPFS: bafyrei...)
```

When alert fires:
```
ALERT FIRED
Silent since: October 2nd
Reason: 4 days without activity (threshold: 3 days)
Subscribers notified: 847
```

---

## Key Implementation Rules

- **Never store private keys on the server.** Keypairs are generated client-side using Web Crypto API. Only public keys are stored in the database.
- **Social media posts alone are not valid check-ins.** Both a post AND a biometric/PIN confirmed signature are required.
- **Duress PIN must be indistinguishable from real PIN.** App must behave completely normally after duress PIN entry.
- **Distress attestations look identical to normal attestations.** Only readable as distress by someone with the public distress key.
- **Snooze must be signed.** A snooze request must carry a valid signature so authorities cannot fake it to suppress alerts.
- **IPFS CIDs are the source of truth.** Always store the CID so anyone can independently verify attestations.
- **Nostr is priority one.** Relay subscriptions are instant, require no API keys, and are censorship resistant by design.
- **Monitoring jobs must be independent.** Each platform has its own Bull job. One failing does not affect the others.

---

## Social Media Monitoring

### Nostr — Relay Subscription
```typescript
import { relayInit } from 'nostr-tools';

const relay = relayInit('wss://relay.damus.io');
await relay.connect();

relay.sub([{ authors: [userNostrPublicKey] }]).on('event', async (event) => {
  await handlePostDetected(canaryId, 'nostr');
});
```

### Mastodon — Webhook
```
POST /webhooks/mastodon
Mastodon sends event when user posts
→ handlePostDetected(canaryId, 'mastodon')
```

### Bluesky — Polling
```typescript
// Bull job runs every 30 minutes
async function pollBluesky(canaryId: string, handle: string) {
  const response = await fetch(
    `https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor=${handle}&limit=1`
  );
  const data = await response.json();
  const latestPost = data.feed[0];

  if (isNewPost(latestPost)) {
    await handlePostDetected(canaryId, 'bluesky');
  }
}
```

---

## PWA Setup

```javascript
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
});

module.exports = withPWA({
  reactStrictMode: true,
});
```

```json
// public/manifest.json
{
  "name": "Lifer",
  "short_name": "Lifer",
  "description": "Your safety canary",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#000000",
  "theme_color": "#000000",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

---

## Environment Variables

```env
# Database
DATABASE_URL=

# Redis
REDIS_URL=

# Pinata (IPFS storage — use JWT only, ignore API Key and Secret)
PINATA_JWT=

# Resend (email alerts)
RESEND_API_KEY=

# Telegram
TELEGRAM_BOT_TOKEN=

# Web Push
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=

# App
NEXT_PUBLIC_APP_URL=
```

---

## Build Priority Order

```
Day 1 → Registration + keypair generation (Web Crypto)
         + WebAuthn biometric setup
         + Basic database + Prisma schema

Day 2 → Nostr relay subscription
         + Two-layer check-in logic
         + IPFS attestation posting via Pinata

Day 3 → Alert system (email + Telegram)
         + Threshold checking Bull job
         + Push notifications via Web Push

Day 4 → Public canary page UI
         + Subscribe form
         + PWA setup + deployment
         + Demo polish
```

---

## UI Design Direction — Dark Glass Luxury + 3D

Design the Lifer UI as a luxury security product. Think: Obsidian card. Titanium edge. A product that a journalist hiding from a government would trust with their life. Every screen must feel like it was made by a boutique studio in Berlin — not a hackathon.

### Aesthetic: Dark Glass Luxury + Subtle 3D

Palette:
- Background: Near-black (`#080808` to `#0f0f0f`)
- Glass cards: `rgba(255,255,255,0.04)` with `backdrop-filter: blur(24px)`
- Borders: `rgba(255,255,255,0.08)` — barely visible, like frosted crystal
- Primary accent: Cold electric white (`#F0F4FF`)
- Alert red: Deep crimson (`#C0392B`) — not bright, not screaming. Grave.
- Safe green: Bioluminescent (`#00FF8C`) — like a pulse on a monitor
- Gold trim: Used SPARINGLY on status badges (`#C9A96E`)

Typography:
- Display headings: `Playfair Display` — serif, editorial, authoritative
- Body text: `DM Mono` or `IBM Plex Mono` — monospace, clinical, trustworthy
- Import both from Google Fonts in `layout.tsx`
- Never use Inter, Roboto, or system fonts

Glass card style (apply to every card/panel):
```css
.glass-card {
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  box-shadow: 
    0 0 0 1px rgba(255,255,255,0.04),
    0 32px 64px rgba(0,0,0,0.6),
    inset 0 1px 0 rgba(255,255,255,0.1);
}
```

3D depth effects:
- Mouse-tracking parallax tilt on cards using `onMouseMove` — `perspective(1000px) rotateX() rotateY()`
- Subtle floating animation on the status orb (green/red pulse)
- Page transitions: elements slide in from depth (`translateZ` + `opacity`)
- The canary status globe is a Three.js sphere with: wireframe mesh outer shell, pulsing inner glow (green = safe, red = alert), slow rotation, brighter glow on hover

Status indicators:
- Safe: Animated radial pulse, bioluminescent green glow, like a heartbeat monitor
- Alert: Slow crimson throb, subtle screen edge vignette turns red

Motion rules:
- All transitions: `cubic-bezier(0.16, 1, 0.3, 1)` — ease out expo
- Entrance animations: stagger children 60ms apart, fade + rise from `Y+12px`
- Hover on cards: slight tilt (3–5deg max), brightness lift, border glow
- No bouncing. No playful easing. Every motion is deliberate and calm.

Overall feel: If Palantir, Apple, and a cold-war spy agency made a safety app together — this is what it would look like.

---

## IMPORTANT: CRITICAL — Tailwind + Custom CSS Setup

**Blank screen is the #1 failure mode when mixing Tailwind with custom CSS and glass effects. Follow this setup exactly.**

### 1. tailwind.config.ts — extend, don't replace

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'lifer-bg': '#080808',
        'lifer-surface': 'rgba(255,255,255,0.04)',
        'lifer-border': 'rgba(255,255,255,0.08)',
        'lifer-white': '#F0F4FF',
        'lifer-green': '#00FF8C',
        'lifer-red': '#C0392B',
        'lifer-gold': '#C9A96E',
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        mono: ['DM Mono', 'monospace'],
      },
      backdropBlur: {
        glass: '24px',
      },
    },
  },
  plugins: [],
}

export default config
```

### 2. globals.css — always start with the Tailwind directives

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom layer — declare glass classes here so Tailwind doesn't purge them */
@layer components {
  .glass-card {
    background: rgba(255, 255, 255, 0.04);
    backdrop-filter: blur(24px) saturate(180%);
    -webkit-backdrop-filter: blur(24px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 20px;
    box-shadow:
      0 0 0 1px rgba(255,255,255,0.04),
      0 32px 64px rgba(0,0,0,0.6),
      inset 0 1px 0 rgba(255,255,255,0.1);
  }
}

html, body {
  background-color: #080808;
  color: #F0F4FF;
  min-height: 100vh;
}
```

### 3. layout.tsx — import globals.css and fonts here, nowhere else

```typescript
import './globals.css'
import { Playfair_Display, DM_Mono } from 'next/font/google'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-mono',
})

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmMono.variable}`}>
      <body className="bg-[#080808] text-[#F0F4FF] min-h-screen antialiased">
        {children}
      </body>
    </html>
  )
}
```

### 4. Rules to prevent blank screens

- **Never use `rgba()` values directly in Tailwind class names** — put them in `globals.css` under `@layer components` or use inline `style={{}}` props
- **Never skip `@tailwind base`** — removing it breaks all box-sizing and resets, causing layout collapse
- **Always wrap Three.js canvas in a `<div>` with explicit `width` and `height`** — a canvas with no dimensions renders nothing
- **Test `backdrop-filter` fallback** — some environments don't support it; add `background: rgba(10,10,10,0.85)` as a fallback
- **If a page is blank:** check browser console first. 99% of the time it's a missing import, a font that failed to load, or a Three.js canvas with `height: 0`

---

## Hackathon Context

- **Project name:** Lifer
- **Track:** Infrastructure & Digital Rights
- **Sponsor:** Protocol Labs
- **Prize pool:** $6,000
- **Pitch:** "Warrant canaries exist for Apple and Reddit. Lifer builds it for the journalist, the activist, and the whistleblower — with cryptographic proof that silence means danger."
- **Why Protocol Labs:** Uses IPFS for tamper-proof attestation storage and Filecoin for guaranteed persistence. Demonstrates a real human rights use case for decentralized infrastructure.
- **Demo moment:** Show a green canary page. Stop posting. Watch it turn red. Watch the alert fire. That image is more powerful than any technical explanation.