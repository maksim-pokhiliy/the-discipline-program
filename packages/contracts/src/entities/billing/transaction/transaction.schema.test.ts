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

const ROW_WITHOUT_UPDATED_AT = Object.fromEntries(
  Object.entries(TRANSACTION_ROW).filter(([key]) => key !== "updatedAt"),
);

describe("transactionSchema", () => {
  it("parses a complete transaction row", () => {
    expect(transactionSchema.parse(TRANSACTION_ROW)).toEqual(TRANSACTION_ROW);
  });

  it.each(NULLABLE_FIELDS)("accepts null for %s", (field) => {
    expect(transactionSchema.safeParse({ ...TRANSACTION_ROW, [field]: null }).success).toBe(true);
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

  it("rejects a row without updatedAt", () => {
    expect(transactionSchema.safeParse(ROW_WITHOUT_UPDATED_AT).success).toBe(false);
  });
});
