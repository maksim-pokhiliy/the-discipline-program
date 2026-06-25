-- CreateEnum
CREATE TYPE "MobilePublishChannel" AS ENUM ('GENERAL');

-- CreateEnum
CREATE TYPE "MobilePublishAction" AS ENUM ('CREATED', 'UPDATED', 'SKIPPED', 'CONFLICT');

-- CreateTable
CREATE TABLE "app_mobile_connections" (
    "id" TEXT NOT NULL,
    "coachProfileId" TEXT NOT NULL,
    "encryptedToken" TEXT NOT NULL,
    "legacyUserId" TEXT NOT NULL,
    "legacyUserName" TEXT NOT NULL,
    "legacyUserRole" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_mobile_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_mobile_publish_links" (
    "id" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "channel" "MobilePublishChannel" NOT NULL DEFAULT 'GENERAL',
    "legacyLevelId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_mobile_publish_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_mobile_published_days" (
    "id" TEXT NOT NULL,
    "linkId" TEXT NOT NULL,
    "scheduledDate" DATE NOT NULL,
    "legacyRowId" INTEGER NOT NULL,
    "contentHash" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_mobile_published_days_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "app_mobile_connections_expiresAt_idx" ON "app_mobile_connections"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "app_mobile_connections_coachProfileId_key" ON "app_mobile_connections"("coachProfileId");

-- CreateIndex
CREATE INDEX "app_mobile_publish_links_connectionId_idx" ON "app_mobile_publish_links"("connectionId");

-- CreateIndex
CREATE INDEX "app_mobile_publish_links_planId_idx" ON "app_mobile_publish_links"("planId");

-- CreateIndex
CREATE UNIQUE INDEX "app_mobile_publish_links_planId_channel_legacyLevelId_key" ON "app_mobile_publish_links"("planId", "channel", "legacyLevelId");

-- CreateIndex
CREATE INDEX "app_mobile_published_days_linkId_idx" ON "app_mobile_published_days"("linkId");

-- CreateIndex
CREATE UNIQUE INDEX "app_mobile_published_days_linkId_scheduledDate_key" ON "app_mobile_published_days"("linkId", "scheduledDate");

-- AddForeignKey
ALTER TABLE "app_mobile_connections" ADD CONSTRAINT "app_mobile_connections_coachProfileId_fkey" FOREIGN KEY ("coachProfileId") REFERENCES "app_coach_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_mobile_publish_links" ADD CONSTRAINT "app_mobile_publish_links_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "app_mobile_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_mobile_publish_links" ADD CONSTRAINT "app_mobile_publish_links_planId_fkey" FOREIGN KEY ("planId") REFERENCES "lms_training_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_mobile_published_days" ADD CONSTRAINT "app_mobile_published_days_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "app_mobile_publish_links"("id") ON DELETE CASCADE ON UPDATE CASCADE;

