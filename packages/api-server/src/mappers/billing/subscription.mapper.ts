import { type Subscription as PrismaSubscription } from "@prisma/client";

import { type Subscription } from "@repo/contracts/billing/subscription";

import { BILLING_PROVIDER_MAP, SUBSCRIPTION_STATUS_MAP } from "./enum-maps";

export const mapToSubscription = (s: PrismaSubscription): Subscription => ({
  id: s.id,
  userId: s.userId,
  productId: s.productId,
  priceId: s.priceId,
  provider: BILLING_PROVIDER_MAP[s.provider],
  status: SUBSCRIPTION_STATUS_MAP[s.status],
  autoRenew: s.autoRenew,
  currentPeriodStart: s.currentPeriodStart,
  currentPeriodEnd: s.currentPeriodEnd,
  graceEndsAt: s.graceEndsAt,
  canceledAt: s.canceledAt,
  endedAt: s.endedAt,
  createdAt: s.createdAt,
  updatedAt: s.updatedAt,
});
