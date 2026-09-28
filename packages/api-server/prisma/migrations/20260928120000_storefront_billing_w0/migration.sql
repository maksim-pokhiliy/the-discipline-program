-- AssertBillingRowsConvertible
DO $$
DECLARE
  one_time_price_count bigint;
  subscription_count bigint;
  transaction_count bigint;
BEGIN
  SELECT count(*) INTO one_time_price_count FROM "app_prices" WHERE "interval" = 'ONE_TIME';
  SELECT count(*) INTO subscription_count FROM "app_subscriptions";
  SELECT count(*) INTO transaction_count FROM "app_transactions";

  IF one_time_price_count > 0 OR subscription_count > 0 OR transaction_count > 0 THEN
    RAISE EXCEPTION 'Migration 20260928120000_storefront_billing_w0 refused: the database holds % ONE_TIME price(s), % subscription row(s) and % transaction row(s), and none of them converts faithfully to the new billing schema. Convert or remove these rows by hand, then run "prisma migrate resolve --rolled-back 20260928120000_storefront_billing_w0" and deploy again.', one_time_price_count, subscription_count, transaction_count;
  END IF;
END $$;

-- CreateEnum
CREATE TYPE "BillingProvider" AS ENUM ('MONOBANK', 'MANUAL', 'FREE');

-- CreateEnum
CREATE TYPE "PlanDelivery" AS ENUM ('JOIN', 'COPY');

-- CreateEnum
CREATE TYPE "PeriodUnit" AS ENUM ('DAY', 'WEEK', 'MONTH', 'YEAR');

-- CreateEnum
CREATE TYPE "TransactionKind" AS ENUM ('INITIAL', 'RENEWAL', 'ONE_OFF', 'REFUND');

-- AlterEnum
CREATE TYPE "SubscriptionStatus_new" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELED', 'EXPIRED');
ALTER TABLE "app_subscriptions" ALTER COLUMN "status" TYPE "SubscriptionStatus_new" USING ("status"::text::"SubscriptionStatus_new");
ALTER TYPE "SubscriptionStatus" RENAME TO "SubscriptionStatus_old";
ALTER TYPE "SubscriptionStatus_new" RENAME TO "SubscriptionStatus";
DROP TYPE "SubscriptionStatus_old";

-- DropIndex
DROP INDEX "app_subscriptions_status_idx";

-- DropIndex
DROP INDEX "app_subscriptions_userId_key";

-- DropIndex
DROP INDEX "app_transactions_providerTxId_key";

-- AlterTable
ALTER TABLE "app_prices" ADD COLUMN     "autoRenew" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "periodCount" INTEGER NOT NULL DEFAULT 4,
ADD COLUMN     "periodUnit" "PeriodUnit" NOT NULL DEFAULT 'WEEK',
ALTER COLUMN "currency" SET DEFAULT 'UAH';

-- BackfillPricePeriod
UPDATE "app_prices"
SET "periodCount" = 1,
    "periodUnit" = CASE "interval"
      WHEN 'MONTHLY' THEN 'MONTH'::"PeriodUnit"
      WHEN 'YEARLY' THEN 'YEAR'::"PeriodUnit"
    END,
    "autoRenew" = true;

-- AlterTable
ALTER TABLE "app_subscriptions" ADD COLUMN     "autoRenew" BOOLEAN NOT NULL,
ADD COLUMN     "cardToken" TEXT,
ADD COLUMN     "endedAt" TIMESTAMP(3),
ADD COLUMN     "productId" TEXT NOT NULL,
ADD COLUMN     "provider" "BillingProvider" NOT NULL,
ADD COLUMN     "providerSubscriptionId" TEXT,
ALTER COLUMN "priceId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "app_transactions" ADD COLUMN     "kind" "TransactionKind" NOT NULL,
ADD COLUMN     "periodEnd" TIMESTAMP(3),
ADD COLUMN     "periodStart" TIMESTAMP(3),
ADD COLUMN     "provider" "BillingProvider" NOT NULL;

-- AlterTable
ALTER TABLE "lms_plan_enrollments" ADD COLUMN     "subscriptionId" TEXT;

-- CreateTable
CREATE TABLE "app_product_plans" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "delivery" "PlanDelivery" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_product_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_billing_webhook_events" (
    "id" TEXT NOT NULL,
    "provider" "BillingProvider" NOT NULL,
    "eventKey" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "error" TEXT,

    CONSTRAINT "app_billing_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "app_product_plans_planId_idx" ON "app_product_plans"("planId");

-- CreateIndex
CREATE UNIQUE INDEX "app_product_plans_productId_planId_key" ON "app_product_plans"("productId", "planId");

-- CreateIndex
CREATE INDEX "app_billing_webhook_events_receivedAt_idx" ON "app_billing_webhook_events"("receivedAt");

-- CreateIndex
CREATE INDEX "app_billing_webhook_events_processedAt_idx" ON "app_billing_webhook_events"("processedAt");

-- CreateIndex
CREATE UNIQUE INDEX "app_billing_webhook_events_provider_eventKey_key" ON "app_billing_webhook_events"("provider", "eventKey");

-- CreateIndex
CREATE UNIQUE INDEX "app_subscriptions_providerSubscriptionId_key" ON "app_subscriptions"("providerSubscriptionId");

-- CreateIndex
CREATE INDEX "app_subscriptions_status_currentPeriodEnd_idx" ON "app_subscriptions"("status", "currentPeriodEnd");

-- CreateIndex
CREATE INDEX "app_subscriptions_productId_idx" ON "app_subscriptions"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "app_subscriptions_userId_productId_key" ON "app_subscriptions"("userId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "app_transactions_provider_providerTxId_kind_key" ON "app_transactions"("provider", "providerTxId", "kind");

-- CreateIndex
CREATE INDEX "lms_plan_enrollments_subscriptionId_idx" ON "lms_plan_enrollments"("subscriptionId");

-- AddForeignKey
ALTER TABLE "app_product_plans" ADD CONSTRAINT "app_product_plans_productId_fkey" FOREIGN KEY ("productId") REFERENCES "app_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_product_plans" ADD CONSTRAINT "app_product_plans_planId_fkey" FOREIGN KEY ("planId") REFERENCES "lms_training_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_subscriptions" ADD CONSTRAINT "app_subscriptions_productId_fkey" FOREIGN KEY ("productId") REFERENCES "app_products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lms_plan_enrollments" ADD CONSTRAINT "lms_plan_enrollments_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "app_subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddCheckConstraint
ALTER TABLE "app_prices" ADD CONSTRAINT "app_prices_period_count_check" CHECK ("periodCount" BETWEEN 1 AND 365);

-- AddCheckConstraint
ALTER TABLE "app_subscriptions" ADD CONSTRAINT "app_subscriptions_price_required_check" CHECK ("provider" = 'MANUAL' OR "priceId" IS NOT NULL);
