import {
  BillingProvider as PrismaBillingProvider,
  type Subscription as PrismaSubscription,
  SubscriptionStatus as PrismaSubscriptionStatus,
} from "@prisma/client";
import { describe, expect, it } from "vitest";

import {
  BillingProvider,
  type Subscription,
  subscriptionSchema,
  SubscriptionStatus,
} from "@repo/contracts/billing/subscription";

import { mapToSubscription } from "./subscription.mapper";

const SUBSCRIPTION_ID = "clz00000000000000000sub1";
const USER_ID = "clz00000000000000000usr1";
const PRODUCT_ID = "clz00000000000000000prd1";
const PRICE_ID = "clz00000000000000000prc1";
const PERIOD_START = new Date("2026-09-01T00:00:00.000Z");
const PERIOD_END = new Date("2026-09-29T00:00:00.000Z");
const GRACE_ENDS_AT = new Date("2026-10-02T00:00:00.000Z");
const CANCELED_AT = new Date("2026-09-20T00:00:00.000Z");
const ENDED_AT = new Date("2026-10-03T00:00:00.000Z");
const CREATED_AT = new Date("2026-08-31T23:59:00.000Z");
const UPDATED_AT = new Date("2026-09-29T00:00:05.000Z");
const SYNTHETIC_CIPHER_TEXT = "synthetic-cipher-text";
const SYNTHETIC_PROVIDER_SUBSCRIPTION_ID = "synthetic-provider-sub";

const makeRow = (overrides: Partial<PrismaSubscription> = {}): PrismaSubscription => ({
  id: SUBSCRIPTION_ID,
  userId: USER_ID,
  productId: PRODUCT_ID,
  priceId: PRICE_ID,
  provider: PrismaBillingProvider.MONOBANK,
  providerSubscriptionId: SYNTHETIC_PROVIDER_SUBSCRIPTION_ID,
  cardToken: SYNTHETIC_CIPHER_TEXT,
  status: PrismaSubscriptionStatus.PAST_DUE,
  autoRenew: true,
  currentPeriodStart: PERIOD_START,
  currentPeriodEnd: PERIOD_END,
  graceEndsAt: GRACE_ENDS_AT,
  canceledAt: CANCELED_AT,
  endedAt: ENDED_AT,
  createdAt: CREATED_AT,
  updatedAt: UPDATED_AT,
  ...overrides,
});

const EXPECTED_SUBSCRIPTION: Subscription = {
  id: SUBSCRIPTION_ID,
  userId: USER_ID,
  productId: PRODUCT_ID,
  priceId: PRICE_ID,
  provider: BillingProvider.MONOBANK,
  status: SubscriptionStatus.PAST_DUE,
  autoRenew: true,
  currentPeriodStart: PERIOD_START,
  currentPeriodEnd: PERIOD_END,
  graceEndsAt: GRACE_ENDS_AT,
  canceledAt: CANCELED_AT,
  endedAt: ENDED_AT,
  createdAt: CREATED_AT,
  updatedAt: UPDATED_AT,
};

const NULLABLE_CASES: [keyof Subscription, Partial<PrismaSubscription>][] = [
  ["priceId", { priceId: null }],
  ["graceEndsAt", { graceEndsAt: null }],
  ["canceledAt", { canceledAt: null }],
  ["endedAt", { endedAt: null }],
];

describe("mapToSubscription", () => {
  it("maps a subscription row to the contract shape", () => {
    expect(mapToSubscription(makeRow())).toStrictEqual(EXPECTED_SUBSCRIPTION);
  });

  it("produces a value subscriptionSchema accepts", () => {
    const result = mapToSubscription(makeRow());

    expect(subscriptionSchema.parse(result)).toStrictEqual(result);
  });

  it("never exposes cardToken or providerSubscriptionId", () => {
    const result = mapToSubscription(makeRow());

    expect(result).not.toHaveProperty("cardToken");
    expect(result).not.toHaveProperty("providerSubscriptionId");
    expect(Object.values(result)).not.toContain(SYNTHETIC_CIPHER_TEXT);
    expect(Object.values(result)).not.toContain(SYNTHETIC_PROVIDER_SUBSCRIPTION_ID);
  });

  it.each(NULLABLE_CASES)("passes null through for %s", (field, overrides) => {
    expect(mapToSubscription(makeRow(overrides))[field]).toBeNull();
  });

  it("has no cardToken and no providerSubscriptionId key at the type level", () => {
    type ResultKeys = keyof ReturnType<typeof mapToSubscription>;
    const assertNoCardToken: "cardToken" extends ResultKeys ? never : true = true;
    const assertNoProviderSubscriptionId: "providerSubscriptionId" extends ResultKeys
      ? never
      : true = true;

    expect(assertNoCardToken).toBe(true);
    expect(assertNoProviderSubscriptionId).toBe(true);
  });
});
