-- AlterTable
ALTER TABLE "app_mobile_publish_links" ADD COLUMN     "athleteId" TEXT,
ADD COLUMN     "legacyUserId" INTEGER,
ALTER COLUMN "legacyLevelId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "app_mobile_publish_links_athleteId_idx" ON "app_mobile_publish_links"("athleteId");

-- CreateIndex
CREATE UNIQUE INDEX "app_mobile_publish_links_planId_channel_athleteId_key" ON "app_mobile_publish_links"("planId", "channel", "athleteId");

-- CreateIndex
CREATE UNIQUE INDEX "app_mobile_publish_links_planId_channel_legacyUserId_key" ON "app_mobile_publish_links"("planId", "channel", "legacyUserId");

-- AddForeignKey
ALTER TABLE "app_mobile_publish_links" ADD CONSTRAINT "app_mobile_publish_links_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddCheckConstraint
ALTER TABLE "app_mobile_publish_links" ADD CONSTRAINT "mobile_link_channel_key_xor" CHECK (
    ("channel" = 'GENERAL' AND "legacyLevelId" IS NOT NULL AND "legacyUserId" IS NULL AND "athleteId" IS NULL)
    OR ("channel" = 'INDIVIDUAL' AND "legacyUserId" IS NOT NULL AND "athleteId" IS NOT NULL AND "legacyLevelId" IS NULL)
);
