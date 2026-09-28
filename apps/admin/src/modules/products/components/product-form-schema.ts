import { z } from "zod";

import {
  createProductPriceSchema,
  createProductSchema,
  PRODUCT_CONSTANTS,
} from "@repo/contracts/cms/product";
import { centsToAmount } from "@repo/shared";

const productFormPriceSchema = createProductPriceSchema.omit({ amountCents: true }).extend({
  amount: z.number().min(0).max(centsToAmount(PRODUCT_CONSTANTS.MAX_AMOUNT_CENTS)),
});

export const productFormSchema = createProductSchema.extend({
  price: productFormPriceSchema.optional(),
});

export type ProductFormData = z.infer<typeof productFormSchema>;
