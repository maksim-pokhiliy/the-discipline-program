import { z } from "zod";

import { PRICE_INTERVALS, PRODUCT_CURRENCIES } from "./product.constants";

export const priceSchema = z.object({
  id: z.string().cuid(),
  amountCents: z.number().int().min(0),
  currency: z.string(),
  interval: z.enum(PRICE_INTERVALS),
  isActive: z.boolean(),
});

export const productSchema = z.object({
  id: z.string().cuid(),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  features: z.array(z.string()),
  trainingPlanId: z.string().nullable(),
  isActive: z.boolean(),
  prices: z.array(priceSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createProductPriceSchema = z.object({
  amountCents: z.number().int().min(0),
  currency: z.enum(PRODUCT_CURRENCIES).default("USD"),
  interval: z.enum(PRICE_INTERVALS).default("MONTHLY"),
});

export const createProductSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  description: z.string().min(1),
  features: z.array(z.string()),
  isActive: z.boolean(),
  price: createProductPriceSchema.optional(),
});

export const updateProductSchema = createProductSchema.partial();
