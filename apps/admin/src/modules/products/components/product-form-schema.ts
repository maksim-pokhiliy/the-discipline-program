import { z } from "zod";

import { PriceInterval, ProductCurrency } from "@repo/contracts/cms/product";

const productFormPriceSchema = z.object({
  amount: z.number().min(0),
  currency: z.nativeEnum(ProductCurrency).default(ProductCurrency.USD),
  interval: z.nativeEnum(PriceInterval).default(PriceInterval.MONTHLY),
});

export const productFormSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  description: z.string().min(1),
  features: z.array(z.string()),
  isFeatured: z.boolean(),
  isActive: z.boolean(),
  price: productFormPriceSchema.optional(),
});

export type ProductFormData = z.infer<typeof productFormSchema>;
