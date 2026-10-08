import {
  BillingProvider,
  Currency,
  PlanDelivery,
  SubscriptionStatus,
  TransactionKind,
  TransactionStatus,
} from "@prisma/client";
import { afterAll, describe, expect, it } from "vitest";

import { PRODUCT_CONSTANTS } from "@repo/contracts/cms/product";
import { PERIOD_CONSTANTS } from "@repo/contracts/common";

import {
  cleanupBillingFixtures,
  createBillingFixtureIds,
  createTestPrice,
  createTestProductPlan,
  createTestSubscribedEnrollment,
  createTestSubscription,
  createTestTransaction,
  createTrackedBuyer,
  createTrackedPlan,
  createTrackedPlanCreator,
  createTrackedProduct,
  createTrackedWebhookEvent,
} from "../../test/billing-helpers";
import { cleanupRaw } from "../../test/helpers";

const PRICE_REQUIRED_CHECK = "app_subscriptions_price_required_check";
const PERIOD_COUNT_CHECK = "app_prices_period_count_check";
const AMOUNT_CENTS_CHECK = "app_prices_amount_cents_check";
const UNIQUE_VIOLATION = { code: "P2002" };
const FOREIGN_KEY_VIOLATION = { code: "P2003" };
const PRICED_PROVIDERS = [BillingProvider.MONOBANK, BillingProvider.FREE];
const REFUSED_PERIOD_COUNTS = [PERIOD_CONSTANTS.MIN_COUNT - 1, -1, PERIOD_CONSTANTS.MAX_COUNT + 1];
const ACCEPTED_PERIOD_COUNTS = [PERIOD_CONSTANTS.MIN_COUNT, PERIOD_CONSTANTS.MAX_COUNT];
const REFUSED_AMOUNTS = [-1, PRODUCT_CONSTANTS.MAX_AMOUNT_CENTS + 1];
const ACCEPTED_AMOUNTS = [0, PRODUCT_CONSTANTS.MAX_AMOUNT_CENTS];

const ids = createBillingFixtureIds();

afterAll(async () => {
  await cleanupBillingFixtures(ids);
});

describe("app_subscriptions_userId_productId_key", () => {
  it("refuses a second subscription of a buyer to the same product, whatever its terms", async () => {
    const buyer = await createTrackedBuyer(ids);
    const product = await createTrackedProduct(ids);
    const price = await createTestPrice(product.id);

    await createTestSubscription(buyer.id, product.id, {
      provider: BillingProvider.MANUAL,
      status: SubscriptionStatus.ACTIVE,
      autoRenew: false,
    });

    await expect(
      createTestSubscription(buyer.id, product.id, {
        provider: BillingProvider.MONOBANK,
        priceId: price.id,
        status: SubscriptionStatus.PAST_DUE,
        autoRenew: true,
      }),
    ).rejects.toMatchObject(UNIQUE_VIOLATION);

    const pairCount = await cleanupRaw.subscription.count({
      where: { userId: buyer.id, productId: product.id },
    });

    expect(pairCount).toBe(1);
  });

  it("accepts the same buyer on a second product", async () => {
    const buyer = await createTrackedBuyer(ids);
    const firstProduct = await createTrackedProduct(ids);
    const secondProduct = await createTrackedProduct(ids);

    await createTestSubscription(buyer.id, firstProduct.id);
    await createTestSubscription(buyer.id, secondProduct.id);

    const buyerCount = await cleanupRaw.subscription.count({ where: { userId: buyer.id } });

    expect(buyerCount).toBe(2);
  });

  it("accepts a second buyer on the same product", async () => {
    const firstBuyer = await createTrackedBuyer(ids);
    const secondBuyer = await createTrackedBuyer(ids);
    const product = await createTrackedProduct(ids);

    await createTestSubscription(firstBuyer.id, product.id);
    await createTestSubscription(secondBuyer.id, product.id);

    const productCount = await cleanupRaw.subscription.count({ where: { productId: product.id } });

    expect(productCount).toBe(2);
  });
});

describe("app_subscriptions_providerSubscriptionId_key", () => {
  it("refuses a second subscription with the same provider subscription id", async () => {
    const providerSubscriptionId = `test-provider-subscription-${crypto.randomUUID()}`;
    const buyer = await createTrackedBuyer(ids);
    const firstProduct = await createTrackedProduct(ids);
    const secondProduct = await createTrackedProduct(ids);

    await createTestSubscription(buyer.id, firstProduct.id, { providerSubscriptionId });

    await expect(
      createTestSubscription(buyer.id, secondProduct.id, { providerSubscriptionId }),
    ).rejects.toMatchObject(UNIQUE_VIOLATION);

    const idCount = await cleanupRaw.subscription.count({ where: { providerSubscriptionId } });

    expect(idCount).toBe(1);
  });

  it("accepts any number of subscriptions without a provider subscription id", async () => {
    const buyer = await createTrackedBuyer(ids);
    const firstProduct = await createTrackedProduct(ids);
    const secondProduct = await createTrackedProduct(ids);

    await createTestSubscription(buyer.id, firstProduct.id, { providerSubscriptionId: null });
    await createTestSubscription(buyer.id, secondProduct.id, { providerSubscriptionId: null });

    const buyerCount = await cleanupRaw.subscription.count({ where: { userId: buyer.id } });

    expect(buyerCount).toBe(2);
  });
});

describe(PRICE_REQUIRED_CHECK, () => {
  it.each(PRICED_PROVIDERS)("refuses a %s subscription without a price", async (provider) => {
    const buyer = await createTrackedBuyer(ids);
    const product = await createTrackedProduct(ids);

    await expect(createTestSubscription(buyer.id, product.id, { provider })).rejects.toThrow(
      PRICE_REQUIRED_CHECK,
    );

    const buyerCount = await cleanupRaw.subscription.count({ where: { userId: buyer.id } });

    expect(buyerCount).toBe(0);
  });

  it.each(PRICED_PROVIDERS)("accepts a %s subscription with a price", async (provider) => {
    const buyer = await createTrackedBuyer(ids);
    const product = await createTrackedProduct(ids);
    const price = await createTestPrice(product.id);

    await expect(
      createTestSubscription(buyer.id, product.id, { provider, priceId: price.id }),
    ).resolves.toMatchObject({ provider, priceId: price.id });
  });

  it("accepts a MANUAL subscription without a price", async () => {
    const buyer = await createTrackedBuyer(ids);
    const product = await createTrackedProduct(ids);

    await expect(
      createTestSubscription(buyer.id, product.id, { provider: BillingProvider.MANUAL }),
    ).resolves.toMatchObject({ provider: BillingProvider.MANUAL, priceId: null });
  });
});

describe(PERIOD_COUNT_CHECK, () => {
  it.each(REFUSED_PERIOD_COUNTS)("refuses a period count of %i", async (periodCount) => {
    const product = await createTrackedProduct(ids);

    await expect(createTestPrice(product.id, { periodCount })).rejects.toThrow(PERIOD_COUNT_CHECK);

    const priceCount = await cleanupRaw.price.count({ where: { productId: product.id } });

    expect(priceCount).toBe(0);
  });

  it.each(ACCEPTED_PERIOD_COUNTS)("accepts a period count of %i", async (periodCount) => {
    const product = await createTrackedProduct(ids);

    await expect(createTestPrice(product.id, { periodCount })).resolves.toMatchObject({
      periodCount,
    });
  });
});

describe(AMOUNT_CENTS_CHECK, () => {
  it.each(REFUSED_AMOUNTS)("refuses an amount of %i", async (amountCents) => {
    const product = await createTrackedProduct(ids);

    await expect(createTestPrice(product.id, { amountCents })).rejects.toThrow(AMOUNT_CENTS_CHECK);

    const priceCount = await cleanupRaw.price.count({ where: { productId: product.id } });

    expect(priceCount).toBe(0);
  });

  it.each(ACCEPTED_AMOUNTS)("accepts an amount of %i", async (amountCents) => {
    const product = await createTrackedProduct(ids);

    await expect(createTestPrice(product.id, { amountCents })).resolves.toMatchObject({
      amountCents,
    });
  });
});

describe("app_transactions_provider_providerTxId_kind_key", () => {
  it("refuses a second INITIAL of the same provider transaction, whatever its details", async () => {
    const buyer = await createTrackedBuyer(ids);
    const otherBuyer = await createTrackedBuyer(ids);
    const initial = await createTestTransaction(buyer.id, {
      kind: TransactionKind.INITIAL,
      status: TransactionStatus.SUCCEEDED,
      amountCents: 120_000,
      currency: Currency.UAH,
    });

    await expect(
      createTestTransaction(otherBuyer.id, {
        providerTxId: initial.providerTxId,
        kind: TransactionKind.INITIAL,
        status: TransactionStatus.FAILED,
        amountCents: 5_000,
        currency: Currency.USD,
      }),
    ).rejects.toMatchObject(UNIQUE_VIOLATION);

    const transactionCount = await cleanupRaw.transaction.count({
      where: { providerTxId: initial.providerTxId },
    });

    expect(transactionCount).toBe(1);
  });

  it("accepts a REFUND beside the INITIAL of the same provider transaction", async () => {
    const buyer = await createTrackedBuyer(ids);
    const initial = await createTestTransaction(buyer.id, { kind: TransactionKind.INITIAL });

    await expect(
      createTestTransaction(buyer.id, {
        providerTxId: initial.providerTxId,
        kind: TransactionKind.REFUND,
      }),
    ).resolves.toMatchObject({ providerTxId: initial.providerTxId, kind: TransactionKind.REFUND });
  });

  it("accepts the same provider transaction and kind under another provider", async () => {
    const buyer = await createTrackedBuyer(ids);
    const initial = await createTestTransaction(buyer.id, {
      provider: BillingProvider.MONOBANK,
      kind: TransactionKind.INITIAL,
    });

    await expect(
      createTestTransaction(buyer.id, {
        provider: BillingProvider.MANUAL,
        providerTxId: initial.providerTxId,
        kind: TransactionKind.INITIAL,
      }),
    ).resolves.toMatchObject({
      provider: BillingProvider.MANUAL,
      providerTxId: initial.providerTxId,
    });
  });

  it("accepts two INITIALs of different provider transactions under one provider", async () => {
    const buyer = await createTrackedBuyer(ids);

    await createTestTransaction(buyer.id, { kind: TransactionKind.INITIAL });
    await createTestTransaction(buyer.id, { kind: TransactionKind.INITIAL });

    const buyerCount = await cleanupRaw.transaction.count({ where: { userId: buyer.id } });

    expect(buyerCount).toBe(2);
  });
});

describe("app_billing_webhook_events_provider_eventKey_key", () => {
  it("refuses a second event with the same provider and key", async () => {
    const event = await createTrackedWebhookEvent(ids, { provider: BillingProvider.MONOBANK });

    await expect(
      createTrackedWebhookEvent(ids, {
        provider: BillingProvider.MONOBANK,
        eventKey: event.eventKey,
      }),
    ).rejects.toMatchObject(UNIQUE_VIOLATION);

    const keyCount = await cleanupRaw.billingWebhookEvent.count({
      where: { eventKey: event.eventKey },
    });

    expect(keyCount).toBe(1);
  });

  it("accepts the same key under another provider", async () => {
    const event = await createTrackedWebhookEvent(ids, { provider: BillingProvider.MONOBANK });

    await expect(
      createTrackedWebhookEvent(ids, {
        provider: BillingProvider.MANUAL,
        eventKey: event.eventKey,
      }),
    ).resolves.toMatchObject({ provider: BillingProvider.MANUAL, eventKey: event.eventKey });
  });

  it("accepts a second key under the same provider", async () => {
    const first = await createTrackedWebhookEvent(ids, { provider: BillingProvider.MONOBANK });
    const second = await createTrackedWebhookEvent(ids, { provider: BillingProvider.MONOBANK });

    const keyCount = await cleanupRaw.billingWebhookEvent.count({
      where: { id: { in: [first.id, second.id] } },
    });

    expect(keyCount).toBe(2);
  });
});

describe("app_product_plans_productId_planId_key", () => {
  it("refuses binding the same plan to a product twice, whatever the delivery", async () => {
    const creator = await createTrackedPlanCreator(ids);
    const plan = await createTrackedPlan(ids, creator.id);
    const product = await createTrackedProduct(ids);

    await createTestProductPlan(product.id, plan.id, { delivery: PlanDelivery.JOIN });

    await expect(
      createTestProductPlan(product.id, plan.id, { delivery: PlanDelivery.COPY }),
    ).rejects.toMatchObject(UNIQUE_VIOLATION);

    const bindingCount = await cleanupRaw.productPlan.count({ where: { productId: product.id } });

    expect(bindingCount).toBe(1);
  });

  it("accepts the same plan under two products", async () => {
    const creator = await createTrackedPlanCreator(ids);
    const plan = await createTrackedPlan(ids, creator.id);
    const firstProduct = await createTrackedProduct(ids);
    const secondProduct = await createTrackedProduct(ids);

    await createTestProductPlan(firstProduct.id, plan.id);
    await createTestProductPlan(secondProduct.id, plan.id);

    const bindingCount = await cleanupRaw.productPlan.count({ where: { planId: plan.id } });

    expect(bindingCount).toBe(2);
  });

  it("accepts two plans under one product", async () => {
    const creator = await createTrackedPlanCreator(ids);
    const firstPlan = await createTrackedPlan(ids, creator.id);
    const secondPlan = await createTrackedPlan(ids, creator.id);
    const product = await createTrackedProduct(ids);

    await createTestProductPlan(product.id, firstPlan.id);
    await createTestProductPlan(product.id, secondPlan.id);

    const bindingCount = await cleanupRaw.productPlan.count({ where: { productId: product.id } });

    expect(bindingCount).toBe(2);
  });
});

describe("app_product_plans_planId_fkey", () => {
  it("removes the bindings of a hard-deleted plan and keeps the product", async () => {
    const creator = await createTrackedPlanCreator(ids);
    const plan = await createTrackedPlan(ids, creator.id);
    const product = await createTrackedProduct(ids);

    await createTestProductPlan(product.id, plan.id);

    await cleanupRaw.trainingPlan.delete({ where: { id: plan.id } });

    const bindingCount = await cleanupRaw.productPlan.count({ where: { planId: plan.id } });
    const productCount = await cleanupRaw.product.count({ where: { id: product.id } });

    expect(bindingCount).toBe(0);
    expect(productCount).toBe(1);
  });
});

describe("lms_plan_enrollments_subscriptionId_fkey", () => {
  const enrollOneAthleteOnTwoPlans = async () => {
    const creator = await createTrackedPlanCreator(ids);
    const athlete = await createTrackedBuyer(ids);
    const product = await createTrackedProduct(ids);
    const subscription = await createTestSubscription(athlete.id, product.id);
    const firstPlan = await createTrackedPlan(ids, creator.id);
    const secondPlan = await createTrackedPlan(ids, creator.id);
    const enrollments = await Promise.all(
      [firstPlan, secondPlan].map((plan) =>
        createTestSubscribedEnrollment(plan.id, athlete.id, creator.id, subscription.id),
      ),
    );

    return { subscription, enrollments };
  };

  it("lets one subscription feed enrollments on two plans of one athlete", async () => {
    const { subscription } = await enrollOneAthleteOnTwoPlans();

    const fedCount = await cleanupRaw.planEnrollment.count({
      where: { subscriptionId: subscription.id },
    });

    expect(fedCount).toBe(2);
  });

  it("unlinks the enrollments and keeps them live when the subscription is deleted", async () => {
    const { subscription, enrollments } = await enrollOneAthleteOnTwoPlans();

    await cleanupRaw.subscription.delete({ where: { id: subscription.id } });

    const stored = await cleanupRaw.planEnrollment.findMany({
      where: { id: { in: enrollments.map((enrollment) => enrollment.id) } },
    });

    expect(stored).toHaveLength(2);

    for (const enrollment of stored) {
      expect(enrollment).toMatchObject({ subscriptionId: null, deletedAt: null });
    }
  });
});

describe("app_subscriptions_productId_fkey", () => {
  it("refuses a hard delete of a product that has a subscription", async () => {
    const buyer = await createTrackedBuyer(ids);
    const product = await createTrackedProduct(ids);

    await createTestSubscription(buyer.id, product.id, {
      provider: BillingProvider.MANUAL,
      priceId: null,
    });

    await expect(cleanupRaw.product.delete({ where: { id: product.id } })).rejects.toMatchObject(
      FOREIGN_KEY_VIOLATION,
    );

    const productCount = await cleanupRaw.product.count({ where: { id: product.id } });

    expect(productCount).toBe(1);
  });

  it("hard-deletes a product without subscriptions", async () => {
    const product = await createTrackedProduct(ids);

    await expect(cleanupRaw.product.delete({ where: { id: product.id } })).resolves.toMatchObject({
      id: product.id,
    });

    const productCount = await cleanupRaw.product.count({ where: { id: product.id } });

    expect(productCount).toBe(0);
  });
});

describe("app_subscriptions_priceId_fkey", () => {
  it("refuses a hard delete of a price that a subscription references", async () => {
    const buyer = await createTrackedBuyer(ids);
    const product = await createTrackedProduct(ids);
    const price = await createTestPrice(product.id);

    await createTestSubscription(buyer.id, product.id, {
      provider: BillingProvider.MONOBANK,
      priceId: price.id,
    });

    await expect(cleanupRaw.price.delete({ where: { id: price.id } })).rejects.toMatchObject(
      FOREIGN_KEY_VIOLATION,
    );

    const priceCount = await cleanupRaw.price.count({ where: { id: price.id } });

    expect(priceCount).toBe(1);
  });

  it("hard-deletes a price without subscriptions", async () => {
    const product = await createTrackedProduct(ids);
    const price = await createTestPrice(product.id);

    await cleanupRaw.price.delete({ where: { id: price.id } });

    const priceCount = await cleanupRaw.price.count({ where: { id: price.id } });

    expect(priceCount).toBe(0);
  });
});

describe("app_subscriptions_userId_fkey", () => {
  it("refuses a hard delete of a buyer who has a subscription", async () => {
    const buyer = await createTrackedBuyer(ids);
    const product = await createTrackedProduct(ids);

    await createTestSubscription(buyer.id, product.id);

    await expect(cleanupRaw.user.delete({ where: { id: buyer.id } })).rejects.toMatchObject(
      FOREIGN_KEY_VIOLATION,
    );

    const buyerCount = await cleanupRaw.user.count({ where: { id: buyer.id } });

    expect(buyerCount).toBe(1);
  });

  it("hard-deletes a buyer without billing rows", async () => {
    const buyer = await createTrackedBuyer(ids);

    await expect(cleanupRaw.user.delete({ where: { id: buyer.id } })).resolves.toMatchObject({
      id: buyer.id,
    });

    const buyerCount = await cleanupRaw.user.count({ where: { id: buyer.id } });

    expect(buyerCount).toBe(0);
  });
});

describe("app_transactions_userId_fkey", () => {
  it("refuses a hard delete of a buyer who has a transaction", async () => {
    const buyer = await createTrackedBuyer(ids);

    await createTestTransaction(buyer.id);

    await expect(cleanupRaw.user.delete({ where: { id: buyer.id } })).rejects.toMatchObject(
      FOREIGN_KEY_VIOLATION,
    );

    const buyerCount = await cleanupRaw.user.count({ where: { id: buyer.id } });

    expect(buyerCount).toBe(1);
  });
});

describe("the Stripe-era columns", () => {
  it("are gone from the database together with the PriceInterval type", async () => {
    const columns = await cleanupRaw.$queryRaw<{ column_name: string }[]>`
      select column_name
      from information_schema.columns
      where (table_name = 'app_products' and column_name = 'stripeProductId')
         or (table_name = 'app_prices' and column_name in ('interval', 'stripePriceId'))`;
    const types = await cleanupRaw.$queryRaw<{ typname: string }[]>`
      select typname from pg_type where typname = 'PriceInterval'`;

    expect(columns).toEqual([]);
    expect(types).toEqual([]);
  });
});
