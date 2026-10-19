-- SetLockTimeout
SET LOCAL lock_timeout = '5s';

-- DropIndex
DROP INDEX "marketing_page_sections_pageSlug_isActive_idx";

-- DropIndex
DROP INDEX "marketing_page_sections_pageSlug_section_key";

-- AlterTable
ALTER TABLE "marketing_page_sections" ADD COLUMN     "locale" TEXT NOT NULL DEFAULT 'en';

-- CreateTable
CREATE TABLE "marketing_locales" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_locales_pkey" PRIMARY KEY ("code")
);

-- InsertDefaultLocale
INSERT INTO "marketing_locales" ("code", "name", "isEnabled", "sortOrder", "createdAt", "updatedAt") VALUES ('en', 'English', true, 0, now(), now());

-- CreateIndex
CREATE INDEX "marketing_page_sections_pageSlug_locale_isActive_idx" ON "marketing_page_sections"("pageSlug", "locale", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_page_sections_pageSlug_section_locale_key" ON "marketing_page_sections"("pageSlug", "section", "locale");

-- AddForeignKey
ALTER TABLE "marketing_page_sections" ADD CONSTRAINT "marketing_page_sections_locale_fkey" FOREIGN KEY ("locale") REFERENCES "marketing_locales"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

