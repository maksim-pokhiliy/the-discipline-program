import {
  type BillingProvider as PrismaBillingProvider,
  type PlanDelivery as PrismaPlanDelivery,
  type SubscriptionStatus as PrismaSubscriptionStatus,
  type TransactionKind as PrismaTransactionKind,
  type TransactionStatus as PrismaTransactionStatus,
} from "@prisma/client";

import { PlanDelivery } from "@repo/contracts/billing/product-plan";
import { BillingProvider, SubscriptionStatus } from "@repo/contracts/billing/subscription";
import { TransactionKind, TransactionStatus } from "@repo/contracts/billing/transaction";

export const BILLING_PROVIDER_MAP: Record<PrismaBillingProvider, BillingProvider> = {
  MONOBANK: BillingProvider.MONOBANK,
  MANUAL: BillingProvider.MANUAL,
  FREE: BillingProvider.FREE,
};

export const SUBSCRIPTION_STATUS_MAP: Record<PrismaSubscriptionStatus, SubscriptionStatus> = {
  ACTIVE: SubscriptionStatus.ACTIVE,
  PAST_DUE: SubscriptionStatus.PAST_DUE,
  CANCELED: SubscriptionStatus.CANCELED,
  EXPIRED: SubscriptionStatus.EXPIRED,
};

export const TRANSACTION_KIND_MAP: Record<PrismaTransactionKind, TransactionKind> = {
  INITIAL: TransactionKind.INITIAL,
  RENEWAL: TransactionKind.RENEWAL,
  ONE_OFF: TransactionKind.ONE_OFF,
  REFUND: TransactionKind.REFUND,
};

export const TRANSACTION_STATUS_MAP: Record<PrismaTransactionStatus, TransactionStatus> = {
  PENDING: TransactionStatus.PENDING,
  SUCCEEDED: TransactionStatus.SUCCEEDED,
  FAILED: TransactionStatus.FAILED,
};

export const PLAN_DELIVERY_MAP: Record<PrismaPlanDelivery, PlanDelivery> = {
  JOIN: PlanDelivery.JOIN,
  COPY: PlanDelivery.COPY,
};
