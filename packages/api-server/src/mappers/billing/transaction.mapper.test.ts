import {
  BillingProvider as PrismaBillingProvider,
  Currency as PrismaCurrency,
  type Transaction as PrismaTransaction,
  TransactionKind as PrismaTransactionKind,
  TransactionStatus as PrismaTransactionStatus,
} from "@prisma/client";
import { describe, expect, it } from "vitest";

import { BillingProvider } from "@repo/contracts/billing/subscription";
import {
  type Transaction,
  TransactionKind,
  transactionSchema,
  TransactionStatus,
} from "@repo/contracts/billing/transaction";
import { Currency } from "@repo/contracts/common";

import { mapToTransaction } from "./transaction.mapper";

const TRANSACTION_ID = "clz00000000000000000txn1";
const USER_ID = "clz00000000000000000usr1";
const SUBSCRIPTION_ID = "clz00000000000000000sub1";
const AMOUNT_CENTS = 4_900;
const PROVIDER_TX_ID = "synthetic-provider-tx-01";
const PERIOD_START = new Date("2026-09-29T00:00:00.000Z");
const PERIOD_END = new Date("2026-10-27T00:00:00.000Z");
const CREATED_AT = new Date("2026-09-29T00:00:05.000Z");
const UPDATED_AT = new Date("2026-09-29T00:00:07.000Z");
const SYNTHETIC_IDEMPOTENCY_KEY = "synthetic-idempotency";

const makeRow = (overrides: Partial<PrismaTransaction> = {}): PrismaTransaction => ({
  id: TRANSACTION_ID,
  userId: USER_ID,
  subscriptionId: SUBSCRIPTION_ID,
  provider: PrismaBillingProvider.MONOBANK,
  kind: PrismaTransactionKind.RENEWAL,
  amountCents: AMOUNT_CENTS,
  currency: PrismaCurrency.USD,
  status: PrismaTransactionStatus.SUCCEEDED,
  providerTxId: PROVIDER_TX_ID,
  idempotencyKey: SYNTHETIC_IDEMPOTENCY_KEY,
  periodStart: PERIOD_START,
  periodEnd: PERIOD_END,
  createdAt: CREATED_AT,
  updatedAt: UPDATED_AT,
  ...overrides,
});

const EXPECTED_TRANSACTION: Transaction = {
  id: TRANSACTION_ID,
  userId: USER_ID,
  subscriptionId: SUBSCRIPTION_ID,
  provider: BillingProvider.MONOBANK,
  kind: TransactionKind.RENEWAL,
  amountCents: AMOUNT_CENTS,
  currency: Currency.USD,
  status: TransactionStatus.SUCCEEDED,
  providerTxId: PROVIDER_TX_ID,
  periodStart: PERIOD_START,
  periodEnd: PERIOD_END,
  createdAt: CREATED_AT,
  updatedAt: UPDATED_AT,
};

const NULLABLE_CASES: [keyof Transaction, Partial<PrismaTransaction>][] = [
  ["subscriptionId", { subscriptionId: null }],
  ["periodStart", { periodStart: null }],
  ["periodEnd", { periodEnd: null }],
];

describe("mapToTransaction", () => {
  it("maps a transaction row to the contract shape", () => {
    expect(mapToTransaction(makeRow())).toStrictEqual(EXPECTED_TRANSACTION);
  });

  it("never exposes idempotencyKey", () => {
    const result = mapToTransaction(makeRow());

    expect(result).not.toHaveProperty("idempotencyKey");
    expect(Object.values(result)).not.toContain(SYNTHETIC_IDEMPOTENCY_KEY);
  });

  it.each(NULLABLE_CASES)("passes null through for %s", (field, overrides) => {
    expect(mapToTransaction(makeRow(overrides))[field]).toBeNull();
  });

  it.each(Object.values(PrismaBillingProvider))(
    "maps the row provider %s to its contract twin",
    (provider) => {
      expect(mapToTransaction(makeRow({ provider })).provider).toBe(provider);
    },
  );

  it.each(Object.values(PrismaTransactionKind))(
    "maps the row kind %s to its contract twin",
    (kind) => {
      expect(mapToTransaction(makeRow({ kind })).kind).toBe(kind);
    },
  );

  it.each(Object.values(PrismaCurrency))(
    "maps the row currency %s to its contract twin",
    (currency) => {
      expect(mapToTransaction(makeRow({ currency })).currency).toBe(currency);
    },
  );

  it.each(Object.values(PrismaTransactionStatus))(
    "maps the row status %s to its contract twin",
    (status) => {
      expect(mapToTransaction(makeRow({ status })).status).toBe(status);
    },
  );

  it("produces a value transactionSchema accepts", () => {
    const result = mapToTransaction(makeRow());

    expect(transactionSchema.parse(result)).toStrictEqual(result);
  });
});
