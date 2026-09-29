import { z } from "zod";

import { BillingProvider, SubscriptionStatus } from "./subscription.constants";

export const billingProviderSchema = z.nativeEnum(BillingProvider);
export const subscriptionStatusSchema = z.nativeEnum(SubscriptionStatus);

export const subscriptionSchema = z.object({
  id: z.string().cuid(),
  userId: z.string().cuid(),
  productId: z.string().cuid(),
  priceId: z.string().cuid().nullable(),
  provider: billingProviderSchema,
  status: subscriptionStatusSchema,
  autoRenew: z.boolean(),
  currentPeriodStart: z.date(),
  currentPeriodEnd: z.date(),
  graceEndsAt: z.date().nullable(),
  canceledAt: z.date().nullable(),
  endedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
