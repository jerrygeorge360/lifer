-- CreateEnum
CREATE TYPE "CanaryStatus" AS ENUM ('active', 'alerted', 'snoozed');

-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('nostr', 'mastodon', 'bluesky');

-- CreateEnum
CREATE TYPE "AlertReason" AS ENUM ('silence', 'device_locked', 'distress');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "realPinHash" TEXT,
    "duressPinHash" TEXT,
    "publicKey" TEXT NOT NULL,
    "distressKey" TEXT NOT NULL,
    "did" TEXT NOT NULL,
    "webAuthnCredentialId" TEXT,
    "webAuthnPublicKey" BYTEA,
    "webAuthnCounter" INTEGER NOT NULL DEFAULT 0,
    "webAuthnChallenge" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Canary" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "thresholdDays" INTEGER NOT NULL,
    "snoozedUntil" TIMESTAMP(3),
    "lastSeenAt" TIMESTAMP(3),
    "status" "CanaryStatus" NOT NULL DEFAULT 'active',

    CONSTRAINT "Canary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialAccount" (
    "id" TEXT NOT NULL,
    "canaryId" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "handle" TEXT NOT NULL,
    "platformId" TEXT NOT NULL,

    CONSTRAINT "SocialAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscriber" (
    "id" TEXT NOT NULL,
    "canaryId" TEXT NOT NULL,
    "email" TEXT,
    "telegramId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subscriber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attestation" (
    "id" TEXT NOT NULL,
    "canaryId" TEXT NOT NULL,
    "ipfsCid" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "signature" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "isDistress" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Attestation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "canaryId" TEXT NOT NULL,
    "reason" "AlertReason" NOT NULL,
    "firedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notified" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PendingCheckin" (
    "id" TEXT NOT NULL,
    "canaryId" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PendingCheckin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "canaryId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Canary_username_key" ON "Canary"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Canary_userId_key" ON "Canary"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SocialAccount_canaryId_platform_key" ON "SocialAccount"("canaryId", "platform");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- AddForeignKey
ALTER TABLE "Canary" ADD CONSTRAINT "Canary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialAccount" ADD CONSTRAINT "SocialAccount_canaryId_fkey" FOREIGN KEY ("canaryId") REFERENCES "Canary"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscriber" ADD CONSTRAINT "Subscriber_canaryId_fkey" FOREIGN KEY ("canaryId") REFERENCES "Canary"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attestation" ADD CONSTRAINT "Attestation_canaryId_fkey" FOREIGN KEY ("canaryId") REFERENCES "Canary"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_canaryId_fkey" FOREIGN KEY ("canaryId") REFERENCES "Canary"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PendingCheckin" ADD CONSTRAINT "PendingCheckin_canaryId_fkey" FOREIGN KEY ("canaryId") REFERENCES "Canary"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_canaryId_fkey" FOREIGN KEY ("canaryId") REFERENCES "Canary"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
