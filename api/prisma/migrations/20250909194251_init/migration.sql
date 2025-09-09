-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('USER');

-- CreateEnum
CREATE TYPE "public"."PublicLinkStatus" AS ENUM ('active', 'revoked');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL DEFAULT 'USER',
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ClinicalProfile" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "sex" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "bloodType" TEXT,
    "allergies" TEXT[],
    "medications" TEXT[],
    "diseases" TEXT[],
    "surgeries" TEXT[],
    "consentAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClinicalProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PublicCredential" (
    "userId" UUID NOT NULL,
    "pinHash" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicCredential_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "public"."PublicLink" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "public"."PublicLinkStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "PublicLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ClinicalHistory" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "snapshot" JSONB NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changedBy" UUID,
    "note" TEXT,

    CONSTRAINT "ClinicalHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PasswordResetToken" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AuditLog" (
    "id" UUID NOT NULL,
    "actorId" UUID,
    "action" TEXT NOT NULL,
    "target" TEXT,
    "ip" INET,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicalProfile_userId_key" ON "public"."ClinicalProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PublicLink_slug_key" ON "public"."PublicLink"("slug");

-- CreateIndex
CREATE INDEX "PublicLink_userId_idx" ON "public"."PublicLink"("userId");

-- CreateIndex
CREATE INDEX "ClinicalHistory_userId_changedAt_idx" ON "public"."ClinicalHistory"("userId", "changedAt");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_expiresAt_idx" ON "public"."PasswordResetToken"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "public"."AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "public"."AuditLog"("action");

-- AddForeignKey
ALTER TABLE "public"."ClinicalProfile" ADD CONSTRAINT "ClinicalProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PublicCredential" ADD CONSTRAINT "PublicCredential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PublicLink" ADD CONSTRAINT "PublicLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClinicalHistory" ADD CONSTRAINT "ClinicalHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ClinicalHistory" ADD CONSTRAINT "ClinicalHistory_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
