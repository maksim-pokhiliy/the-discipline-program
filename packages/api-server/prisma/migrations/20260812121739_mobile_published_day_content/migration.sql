-- AlterTable
ALTER TABLE "app_mobile_published_days" ADD COLUMN     "dailyProgram" JSONB,
ADD COLUMN     "isRestDay" BOOLEAN;

-- CreateIndex
CREATE INDEX "app_mobile_publish_links_channel_legacyLevelId_idx" ON "app_mobile_publish_links"("channel", "legacyLevelId");

-- CreateIndex
CREATE INDEX "app_mobile_publish_links_channel_legacyUserId_idx" ON "app_mobile_publish_links"("channel", "legacyUserId");

-- AddCheckConstraint
ALTER TABLE "app_mobile_published_days" ADD CONSTRAINT "app_mobile_published_days_rest_xor_program" CHECK (
    "isRestDay" IS NULL OR ("isRestDay" = ("dailyProgram" IS NULL))
);
