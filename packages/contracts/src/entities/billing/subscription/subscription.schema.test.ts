import { describe, expect, it } from "vitest";

import { BillingProvider, SubscriptionStatus } from "./subscription.constants";
import { subscriptionSchema } from "./subscription.schema";

const SUBSCRIPTION_ROW = {
  id: "clz00000000000000000sub1",
  userId: "clz00000000000000000usr1",
  productId: "clz00000000000000000prd1",
  priceId: "clz00000000000000000prc1",
  provider: BillingProvider.MONOBANK,
  status: SubscriptionStatus.PAST_DUE,
  autoRenew: true,
  currentPeriodStart: new Date("2026-09-01T00:00:00.000Z"),
  currentPeriodEnd: new Date("2026-09-29T00:00:00.000Z"),
  graceEndsAt: new Date("2026-10-02T00:00:00.000Z"),
  canceledAt: new Date("2026-09-20T00:00:00.000Z"),
  endedAt: new Date("2026-10-02T00:00:00.000Z"),
  createdAt: new Date("2026-09-01T00:00:00.000Z"),
  updatedAt: new Date("2026-09-29T00:00:00.000Z"),
};

const NULLABLE_FIELDS = ["priceId", "graceEndsAt", "canceledAt", "endedAt"];

const ACCEPTED_ENUM_VALUES: [string, string][] = [
  ["provider", "MONOBANK"],
  ["provider", "MANUAL"],
  ["provider", "FREE"],
  ["status", "ACTIVE"],
  ["status", "PAST_DUE"],
  ["status", "CANCELED"],
  ["status", "EXPIRED"],
];

const SYNTHETIC_CIPHER_TEXT = "synthetic-cipher-text";

const SYNTHETIC_PROVIDER_SUBSCRIPTION_ID = "synthetic-provider-sub";

describe("subscriptionSchema", () => {
  it("parses a complete subscription row", () => {
    expect(subscriptionSchema.parse(SUBSCRIPTION_ROW)).toEqual(SUBSCRIPTION_ROW);
  });

  it.each(NULLABLE_FIELDS)("accepts null for %s", (field) => {
    expect(subscriptionSchema.safeParse({ ...SUBSCRIPTION_ROW, [field]: null }).success).toBe(true);
  });

  it("rejects a provider outside BillingProvider", () => {
    expect(subscriptionSchema.safeParse({ ...SUBSCRIPTION_ROW, provider: "STRIPE" }).success).toBe(
      false,
    );
  });

  it("rejects a status outside SubscriptionStatus", () => {
    expect(subscriptionSchema.safeParse({ ...SUBSCRIPTION_ROW, status: "TRIALING" }).success).toBe(
      false,
    );
  });

  it.each(ACCEPTED_ENUM_VALUES)("accepts the %s %s", (field, value) => {
    expect(subscriptionSchema.safeParse({ ...SUBSCRIPTION_ROW, [field]: value }).success).toBe(
      true,
    );
  });

  it("has no cardToken and no providerSubscriptionId in its shape", () => {
    const keys = Object.keys(subscriptionSchema.shape);

    expect(keys).not.toContain("cardToken");
    expect(keys).not.toContain("providerSubscriptionId");
  });

  it("drops a cardToken and a providerSubscriptionId a row carries", () => {
    const parsed = subscriptionSchema.parse({
      ...SUBSCRIPTION_ROW,
      cardToken: SYNTHETIC_CIPHER_TEXT,
      providerSubscriptionId: SYNTHETIC_PROVIDER_SUBSCRIPTION_ID,
    });

    expect(parsed).not.toHaveProperty("cardToken");
    expect(parsed).not.toHaveProperty("providerSubscriptionId");
  });

  it("rejects a userId that is not a cuid", () => {
    expect(
      subscriptionSchema.safeParse({ ...SUBSCRIPTION_ROW, userId: "not-a-cuid" }).success,
    ).toBe(false);
  });
});
