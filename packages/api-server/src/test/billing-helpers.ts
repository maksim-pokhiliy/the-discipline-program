import {
  BillingProvider,
  Currency,
  PlanDelivery,
  SubscriptionStatus,
  TransactionKind,
  TransactionStatus,
  type BillingWebhookEvent,
  type PlanEnrollment,
  type Prisma,
  type Price,
  type Product,
  type ProductPlan,
  type Subscription,
  type TrainingPlan,
  type Transaction,
  type User,
} from "@prisma/client";

import { FOUR_WEEKS, MS_PER_DAY } from "../utils/date-helpers";

import {
  cleanupRaw,
  createTestCoach,
  createTestPlan,
  createTestProduct,
  createTestUser,
} from "./helpers";
import { createTestEnrollment } from "./schedule-helpers";

const TEST_AMOUNT_CENTS = 120_000;
const TEST_SUBSCRIPTION_PERIOD_MS = FOUR_WEEKS * MS_PER_DAY;

export type BillingFixtureIds = {
  buyerIds: string[];
  productIds: string[];
  planIds: string[];
  planCreatorIds: string[];
  webhookEventIds: string[];
};

export const createBillingFixtureIds = (): BillingFixtureIds => ({
  buyerIds: [],
  productIds: [],
  planIds: [],
  planCreatorIds: [],
  webhookEventIds: [],
});

const trackFixture = async <T extends { id: string }>(
  trackedIds: string[],
  pending: Promise<T>,
): Promise<T> => {
  const fixture = await pending;

  trackedIds.push(fixture.id);

  return fixture;
};

export const createTestPrice = async (
  productId: string,
  overrides: Partial<Omit<Prisma.PriceUncheckedCreateInput, "productId">> = {},
): Promise<Price> =>
  cleanupRaw.price.create({
    data: {
      productId,
      amountCents: TEST_AMOUNT_CENTS,
      ...overrides,
    },
  });

export const createTestSubscription = async (
  userId: string,
  productId: string,
  overrides: Partial<Omit<Prisma.SubscriptionUncheckedCreateInput, "userId" | "productId">> = {},
): Promise<Subscription> => {
  const currentPeriodStart = new Date();

  return cleanupRaw.subscription.create({
    data: {
      userId,
      productId,
      provider: BillingProvider.MANUAL,
      status: SubscriptionStatus.ACTIVE,
      autoRenew: false,
      currentPeriodStart,
      currentPeriodEnd: new Date(currentPeriodStart.getTime() + TEST_SUBSCRIPTION_PERIOD_MS),
      ...overrides,
    },
  });
};

export const createTestTransaction = async (
  userId: string,
  overrides: Partial<Omit<Prisma.TransactionUncheckedCreateInput, "userId">> = {},
): Promise<Transaction> =>
  cleanupRaw.transaction.create({
    data: {
      userId,
      provider: BillingProvider.MONOBANK,
      kind: TransactionKind.INITIAL,
      amountCents: TEST_AMOUNT_CENTS,
      currency: Currency.UAH,
      status: TransactionStatus.SUCCEEDED,
      providerTxId: `test-tx-${crypto.randomUUID()}`,
      idempotencyKey: `test-idempotency-${crypto.randomUUID()}`,
      ...overrides,
    },
  });

export const createTestProductPlan = async (
  productId: string,
  planId: string,
  overrides: Partial<Omit<Prisma.ProductPlanUncheckedCreateInput, "productId" | "planId">> = {},
): Promise<ProductPlan> =>
  cleanupRaw.productPlan.create({
    data: {
      productId,
      planId,
      delivery: PlanDelivery.JOIN,
      ...overrides,
    },
  });

const createTestWebhookEvent = async (
  overrides: Partial<Prisma.BillingWebhookEventUncheckedCreateInput> = {},
): Promise<BillingWebhookEvent> =>
  cleanupRaw.billingWebhookEvent.create({
    data: {
      provider: BillingProvider.MONOBANK,
      eventKey: `test-event-${crypto.randomUUID()}`,
      payload: {},
      ...overrides,
    },
  });

export const createTestSubscribedEnrollment = async (
  planId: string,
  athleteId: string,
  enrolledById: string,
  subscriptionId: string,
): Promise<PlanEnrollment> => {
  const { enrollment } = await createTestEnrollment(planId, athleteId, enrolledById);

  return cleanupRaw.planEnrollment.update({
    where: { id: enrollment.id },
    data: { subscriptionId },
  });
};

export const createTrackedBuyer = (ids: BillingFixtureIds): Promise<User> =>
  trackFixture(ids.buyerIds, createTestUser());

export const createTrackedProduct = (ids: BillingFixtureIds): Promise<Product> =>
  trackFixture(ids.productIds, createTestProduct());

const createPlanCreator = async (): Promise<User> => {
  const { user } = await createTestCoach();

  return user;
};

export const createTrackedPlanCreator = (ids: BillingFixtureIds): Promise<User> =>
  trackFixture(ids.planCreatorIds, createPlanCreator());

export const createTrackedPlan = (
  ids: BillingFixtureIds,
  creatorId: string,
): Promise<TrainingPlan> => trackFixture(ids.planIds, createTestPlan(creatorId));

export const createTrackedWebhookEvent = (
  ids: BillingFixtureIds,
  overrides: Partial<Prisma.BillingWebhookEventUncheckedCreateInput> = {},
): Promise<BillingWebhookEvent> =>
  trackFixture(ids.webhookEventIds, createTestWebhookEvent(overrides));

export const cleanupBillingFixtures = async (ids: BillingFixtureIds): Promise<void> => {
  await cleanupRaw.user.deleteMany({ where: { id: { in: ids.buyerIds } } });
  await cleanupRaw.product.deleteMany({ where: { id: { in: ids.productIds } } });
  await cleanupRaw.trainingPlan.deleteMany({ where: { id: { in: ids.planIds } } });
  await cleanupRaw.user.deleteMany({ where: { id: { in: ids.planCreatorIds } } });
  await cleanupRaw.billingWebhookEvent.deleteMany({ where: { id: { in: ids.webhookEventIds } } });
};
