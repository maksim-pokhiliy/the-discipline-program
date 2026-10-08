-- SetLockTimeout
SET LOCAL lock_timeout = '5s';

-- AssertDeadColumnsEmptyAndAmountsInBounds
DO $$
DECLARE
  stripe_product_count bigint;
  stripe_price_count bigint;
  one_time_price_count bigint;
  out_of_bounds_amount_count bigint;
BEGIN
  SELECT count(*) INTO stripe_product_count FROM "app_products" WHERE "stripeProductId" IS NOT NULL;
  SELECT count(*) INTO stripe_price_count FROM "app_prices" WHERE "stripePriceId" IS NOT NULL;
  SELECT count(*) INTO one_time_price_count FROM "app_prices" WHERE "interval" = 'ONE_TIME';
  SELECT count(*) INTO out_of_bounds_amount_count FROM "app_prices" WHERE "amountCents" NOT BETWEEN 0 AND 99999999;

  IF stripe_product_count > 0 OR stripe_price_count > 0 OR one_time_price_count > 0 OR out_of_bounds_amount_count > 0 THEN
    RAISE EXCEPTION 'Migration 20261008120000_storefront_billing_w0_contract refused: the database holds % product(s) with a Stripe id, % price(s) with a Stripe id, % ONE_TIME price(s) and % price(s) with an amount outside 0..99999999 cents, and dropping the columns would lose that data. Inspect and clear these rows by hand, then run "prisma migrate resolve --rolled-back 20261008120000_storefront_billing_w0_contract" and deploy again.', stripe_product_count, stripe_price_count, one_time_price_count, out_of_bounds_amount_count;
  END IF;
END $$;

-- DropForeignKey
ALTER TABLE "app_subscriptions" DROP CONSTRAINT "app_subscriptions_userId_fkey";

-- DropForeignKey
ALTER TABLE "app_transactions" DROP CONSTRAINT "app_transactions_userId_fkey";

-- DropIndex
DROP INDEX "app_prices_stripePriceId_key";

-- DropIndex
DROP INDEX "app_products_stripeProductId_key";

-- AlterTable
ALTER TABLE "app_prices" DROP COLUMN "interval",
DROP COLUMN "stripePriceId";

-- AlterTable
ALTER TABLE "app_products" DROP COLUMN "stripeProductId";

-- DropEnum
DROP TYPE "PriceInterval";

-- AddForeignKey
ALTER TABLE "app_subscriptions" ADD CONSTRAINT "app_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_transactions" ADD CONSTRAINT "app_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddCheckConstraint
ALTER TABLE "app_prices" ADD CONSTRAINT "app_prices_amount_cents_check" CHECK ("amountCents" BETWEEN 0 AND 99999999);
