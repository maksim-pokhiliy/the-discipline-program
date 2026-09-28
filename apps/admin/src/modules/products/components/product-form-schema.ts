import { z } from "zod";

import { createProductPriceSchema, PRODUCT_CONSTANTS } from "@repo/contracts/cms/product";

const productFormPriceSchema = createProductPriceSchema
  .omit({ amountCents: true })
  .extend({ amount: z.number().min(0) });

export const productFormSchema = z.object({
  title: z.string().min(1).max(PRODUCT_CONSTANTS.MAX_TITLE_LENGTH),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  description: z.string().min(1),
  features: z.array(z.string()),
  isFeatured: z.boolean(),
  isActive: z.boolean(),
  price: productFormPriceSchema.optional(),
});

export type ProductFormData = z.infer<typeof productFormSchema>;
