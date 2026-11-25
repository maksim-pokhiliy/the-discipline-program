-- SetLockTimeout
SET LOCAL lock_timeout = '5s';

-- AssertProductFeaturesHaveNoNullEntry
DO $$
DECLARE
  offending TEXT;
BEGIN
  SELECT string_agg("id", ', ' ORDER BY "id")
  INTO offending
  FROM "app_products"
  WHERE array_position("features", NULL) IS NOT NULL;

  IF offending IS NOT NULL THEN
    RAISE EXCEPTION 'Migration 20261125120000_cms_product_translations refused: app_products.features holds a NULL entry in product(s) %, and a feature without text cannot be given an id. Give each entry its text or remove it by hand, then run "prisma migrate resolve --rolled-back 20261125120000_cms_product_translations" and deploy again.', offending;
  END IF;
END $$;

-- AlterTable
ALTER TABLE "app_products" ADD COLUMN     "featureList" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "wordsUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "app_product_translations" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "featureList" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_product_translations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "app_product_translations_locale_idx" ON "app_product_translations"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "app_product_translations_productId_locale_key" ON "app_product_translations"("productId", "locale");

-- AddForeignKey
ALTER TABLE "app_product_translations" ADD CONSTRAINT "app_product_translations_productId_fkey" FOREIGN KEY ("productId") REFERENCES "app_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_product_translations" ADD CONSTRAINT "app_product_translations_locale_fkey" FOREIGN KEY ("locale") REFERENCES "marketing_locales"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- BackfillFeatureListAndWordsClock
UPDATE "app_products" AS p
SET "featureList" = COALESCE(
      (
        SELECT jsonb_agg(
                 jsonb_build_object('id', gen_random_uuid()::text, 'text', f."text")
                 ORDER BY f."position"
               )
        FROM unnest(p."features") WITH ORDINALITY AS f("text", "position")
      ),
      '[]'::jsonb
    ),
    "wordsUpdatedAt" = p."updatedAt";
