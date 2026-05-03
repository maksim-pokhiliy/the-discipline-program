import { z } from "zod";

import { PRODUCT_CONSTANTS, PriceInterval, ProductCurrency } from "./product.constants";

export const priceSchema = z.object({
  id: z.string().cuid(),
  amountCents: z.number().int().nonnegative().max(PRODUCT_CONSTANTS.MAX_AMOUNT_CENTS),
  currency: z.nativeEnum(ProductCurrency),
  interval: z.nativeEnum(PriceInterval),
  isActive: z.boolean(),
});

export const productSchema = z.object({
  id: z.string().cuid(),
  slug: z
    .string()
    .max(PRODUCT_CONSTANTS.MAX_SLUG_LENGTH)
    .regex(/^[a-z0-9-]+$/),
  title: z.string().min(1).max(PRODUCT_CONSTANTS.MAX_TITLE_LENGTH),
  description: z.string().min(1),
  features: z.array(z.string()),
  isFeatured: z.boolean(),
  isActive: z.boolean(),
  prices: z.array(priceSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createProductPriceSchema = z.object({
  amountCents: z.number().int().nonnegative().max(PRODUCT_CONSTANTS.MAX_AMOUNT_CENTS),
  currency: z.nativeEnum(ProductCurrency).default(ProductCurrency.USD),
  interval: z.nativeEnum(PriceInterval).default(PriceInterval.MONTHLY),
});

export const createProductSchema = z.object({
  title: z.string().min(1).max(PRODUCT_CONSTANTS.MAX_TITLE_LENGTH),
  slug: z
    .string()
    .max(PRODUCT_CONSTANTS.MAX_SLUG_LENGTH)
    .regex(/^[a-z0-9-]+$/),
  description: z.string().min(1).max(PRODUCT_CONSTANTS.MAX_DESCRIPTION_LENGTH),
  features: z.array(z.string()),
  isFeatured: z.boolean(),
  isActive: z.boolean(),
  price: createProductPriceSchema.optional(),
});

export const updateProductSchema = createProductSchema.partial();
