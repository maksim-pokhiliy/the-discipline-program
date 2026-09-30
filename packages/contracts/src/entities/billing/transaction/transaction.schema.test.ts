import { describe, expect, it } from "vitest";

import { Currency } from "../../../common";
import { BillingProvider } from "../subscription";

import { TransactionKind, TransactionStatus } from "./transaction.constants";
import { transactionSchema } from "./transaction.schema";

const TRANSACTION_ROW = {
  id: "clz00000000000000000txn1",
  userId: "clz00000000000000000usr1",
  subscriptionId: "clz00000000000000000sub1",
  provider: BillingProvider.MONOBANK,
  kind: TransactionKind.RENEWAL,
  amountCents: 120_000,
  currency: Currency.UAH,
  status: TransactionStatus.SUCCEEDED,
  providerTxId: "synthetic-provider-tx-01",
  periodStart: new Date("2026-09-29T00:00:00.000Z"),
  periodEnd: new Date("2026-10-27T00:00:00.000Z"),
  createdAt: new Date("2026-09-29T00:00:05.000Z"),
  updatedAt: new Date("2026-09-29T00:00:07.000Z"),
};

const NULLABLE_FIELDS = ["subscriptionId", "periodStart", "periodEnd"];

const REQUIRED_FIELDS = [...NULLABLE_FIELDS, "providerTxId", "updatedAt"];

const CUID_FIELDS = ["id", "userId", "subscriptionId"];

const ACCEPTED_ENUM_VALUES: [string, string][] = [
  ["provider", "MONOBANK"],
  ["provider", "MANUAL"],
  ["provider", "FREE"],
  ["kind", "INITIAL"],
  ["kind", "RENEWAL"],
  ["kind", "ONE_OFF"],
  ["kind", "REFUND"],
  ["status", "PENDING"],
  ["status", "SUCCEEDED"],
  ["status", "FAILED"],
];

const SYNTHETIC_IDEMPOTENCY_KEY = "synthetic-idempotency";

const rowWithout = (field: string): Record<string, unknown> =>
  Object.fromEntries(Object.entries(TRANSACTION_ROW).filter(([key]) => key !== field));

describe("transactionSchema", () => {
  it("parses a complete transaction row", () => {
    expect(transactionSchema.parse(TRANSACTION_ROW)).toEqual(TRANSACTION_ROW);
  });

  it.each(NULLABLE_FIELDS)("accepts null for %s", (field) => {
    expect(transactionSchema.safeParse({ ...TRANSACTION_ROW, [field]: null }).success).toBe(true);
  });

  it("rejects a provider outside BillingProvider", () => {
    expect(transactionSchema.safeParse({ ...TRANSACTION_ROW, provider: "STRIPE" }).success).toBe(
      false,
    );
  });

  it("rejects a kind outside TransactionKind", () => {
    expect(transactionSchema.safeParse({ ...TRANSACTION_ROW, kind: "CHARGEBACK" }).success).toBe(
      false,
    );
  });

  it("rejects a status outside TransactionStatus", () => {
    expect(transactionSchema.safeParse({ ...TRANSACTION_ROW, status: "PROCESSING" }).success).toBe(
      false,
    );
  });

  it.each(ACCEPTED_ENUM_VALUES)("accepts the %s %s", (field, value) => {
    expect(transactionSchema.safeParse({ ...TRANSACTION_ROW, [field]: value }).success).toBe(true);
  });

  it("rejects a currency outside Currency", () => {
    expect(transactionSchema.safeParse({ ...TRANSACTION_ROW, currency: "GBP" }).success).toBe(
      false,
    );
  });

  it("rejects a fractional amountCents", () => {
    expect(transactionSchema.safeParse({ ...TRANSACTION_ROW, amountCents: 99.5 }).success).toBe(
      false,
    );
  });

  it("has no idempotencyKey in its shape", () => {
    expect(Object.keys(transactionSchema.shape)).not.toContain("idempotencyKey");
  });

  it("drops an idempotencyKey a row carries", () => {
    const parsed = transactionSchema.parse({
      ...TRANSACTION_ROW,
      idempotencyKey: SYNTHETIC_IDEMPOTENCY_KEY,
    });

    expect(parsed).not.toHaveProperty("idempotencyKey");
  });

  it.each(REQUIRED_FIELDS)("rejects a row without %s", (field) => {
    expect(transactionSchema.safeParse(rowWithout(field)).success).toBe(false);
  });

  it.each(CUID_FIELDS)("rejects a non-cuid %s", (field) => {
    expect(transactionSchema.safeParse({ ...TRANSACTION_ROW, [field]: "not-a-cuid" }).success).toBe(
      false,
    );
  });
});
