import { z } from "zod";

import { periodSchema } from "../../../common";

import { PRODUCT_CONSTANTS, PRODUCT_PRICE_DEFAULTS, ProductCurrency } from "./product.constants";

const priceAmountCentsSchema = z
  .number()
  .int()
  .nonnegative()
  .max(PRODUCT_CONSTANTS.MAX_AMOUNT_CENTS);

const priceTermsShape = {
  amountCents: priceAmountCentsSchema,
  currency: z.nativeEnum(ProductCurrency),
  ...periodSchema.shape,
  autoRenew: z.boolean(),
};

export const priceSchema = z.object({
  id: z.string().cuid(),
  ...priceTermsShape,
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

export const createProductPriceSchema = z
  .object({
    amountCents: priceTermsShape.amountCents,
    currency: priceTermsShape.currency.default(PRODUCT_PRICE_DEFAULTS.currency),
    periodCount: priceTermsShape.periodCount.default(PRODUCT_PRICE_DEFAULTS.periodCount),
    periodUnit: priceTermsShape.periodUnit.default(PRODUCT_PRICE_DEFAULTS.periodUnit),
    autoRenew: priceTermsShape.autoRenew.default(PRODUCT_PRICE_DEFAULTS.autoRenew),
  })
  .strict();

export const updateProductPriceSchema = z.object(priceTermsShape).strict();

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

export const updateProductSchema = createProductSchema
  .extend({ price: updateProductPriceSchema.optional() })
  .partial();
