import { z } from "zod";

import { Currency } from "../../../common";
import { billingProviderSchema } from "../subscription";

import { TransactionKind, TransactionStatus } from "./transaction.constants";

export const transactionKindSchema = z.nativeEnum(TransactionKind);
export const transactionStatusSchema = z.nativeEnum(TransactionStatus);

export const transactionSchema = z.object({
  id: z.string().cuid(),
  userId: z.string().cuid(),
  subscriptionId: z.string().cuid().nullable(),
  provider: billingProviderSchema,
  kind: transactionKindSchema,
  amountCents: z.number().int(),
  currency: z.nativeEnum(Currency),
  status: transactionStatusSchema,
  providerTxId: z.string(),
  periodStart: z.date().nullable(),
  periodEnd: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
