import { z } from "zod";

import {
  createProductPriceSchema,
  createProductSchema,
  PRODUCT_CONSTANTS,
  PRODUCT_PRICE_DEFAULTS,
} from "@repo/contracts/cms/product";
import { PERIOD_CONSTANTS } from "@repo/contracts/common";
import { centsToAmount } from "@repo/shared";

const productFormPriceSchema = createProductPriceSchema.omit({ amountCents: true }).extend({
  amount: z
    .number({ invalid_type_error: "Enter the price as a number" })
    .min(0)
    .max(centsToAmount(PRODUCT_CONSTANTS.MAX_AMOUNT_CENTS)),
  periodCount: z
    .number({ invalid_type_error: "Enter the period length as a whole number" })
    .int("Expected integer, received float")
    .min(PERIOD_CONSTANTS.MIN_COUNT)
    .max(PERIOD_CONSTANTS.MAX_COUNT)
    .default(PRODUCT_PRICE_DEFAULTS.periodCount),
});

export const productFormSchema = createProductSchema.extend({
  price: productFormPriceSchema.optional(),
});

export type ProductFormData = z.infer<typeof productFormSchema>;
