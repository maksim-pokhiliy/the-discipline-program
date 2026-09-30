import { type Transaction as PrismaTransaction } from "@prisma/client";

import { type Transaction } from "@repo/contracts/billing/transaction";

import { CURRENCY_MAP } from "../common";

import { BILLING_PROVIDER_MAP, TRANSACTION_KIND_MAP, TRANSACTION_STATUS_MAP } from "./enum-maps";

export const mapToTransaction = (t: PrismaTransaction): Transaction => ({
  id: t.id,
  userId: t.userId,
  subscriptionId: t.subscriptionId,
  provider: BILLING_PROVIDER_MAP[t.provider],
  kind: TRANSACTION_KIND_MAP[t.kind],
  amountCents: t.amountCents,
  currency: CURRENCY_MAP[t.currency],
  status: TRANSACTION_STATUS_MAP[t.status],
  providerTxId: t.providerTxId,
  periodStart: t.periodStart,
  periodEnd: t.periodEnd,
  createdAt: t.createdAt,
  updatedAt: t.updatedAt,
});
