import {
  BillingProvider as PrismaBillingProvider,
  PlanDelivery as PrismaPlanDelivery,
  SubscriptionStatus as PrismaSubscriptionStatus,
  TransactionKind as PrismaTransactionKind,
  TransactionStatus as PrismaTransactionStatus,
} from "@prisma/client";
import { describe, expect, it } from "vitest";

import { PlanDelivery } from "@repo/contracts/billing/product-plan";
import { BillingProvider, SubscriptionStatus } from "@repo/contracts/billing/subscription";
import { TransactionKind, TransactionStatus } from "@repo/contracts/billing/transaction";

import {
  BILLING_PROVIDER_MAP,
  PLAN_DELIVERY_MAP,
  SUBSCRIPTION_STATUS_MAP,
  TRANSACTION_KIND_MAP,
  TRANSACTION_STATUS_MAP,
} from "./enum-maps";

type ParityCase = [
  name: string,
  map: Record<string, string>,
  prismaValues: string[],
  contractValues: string[],
];

const PARITY_CASES: ParityCase[] = [
  [
    "BILLING_PROVIDER_MAP",
    BILLING_PROVIDER_MAP,
    Object.values(PrismaBillingProvider),
    Object.values(BillingProvider),
  ],
  [
    "SUBSCRIPTION_STATUS_MAP",
    SUBSCRIPTION_STATUS_MAP,
    Object.values(PrismaSubscriptionStatus),
    Object.values(SubscriptionStatus),
  ],
  [
    "TRANSACTION_KIND_MAP",
    TRANSACTION_KIND_MAP,
    Object.values(PrismaTransactionKind),
    Object.values(TransactionKind),
  ],
  [
    "TRANSACTION_STATUS_MAP",
    TRANSACTION_STATUS_MAP,
    Object.values(PrismaTransactionStatus),
    Object.values(TransactionStatus),
  ],
  [
    "PLAN_DELIVERY_MAP",
    PLAN_DELIVERY_MAP,
    Object.values(PrismaPlanDelivery),
    Object.values(PlanDelivery),
  ],
];

const sameNameMapOf = (values: string[]): Record<string, string> =>
  Object.fromEntries(values.map((value) => [value, value]));

describe("billing enum maps", () => {
  it.each(PARITY_CASES)(
    "%s maps every Prisma value to its contract twin, one to one",
    (_name, map, prismaValues, contractValues) => {
      expect(map).toStrictEqual(sameNameMapOf(prismaValues));
      expect(Object.values(map).sort()).toStrictEqual([...contractValues].sort());
    },
  );
});
