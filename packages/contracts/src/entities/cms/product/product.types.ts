import { type z } from "zod";

import {
  type productSchema,
  type priceSchema,
  type createProductSchema,
  type updateProductSchema,
  type productFeatureSchema,
  type productFeatureWriteSchema,
} from "./product.schema";

export type Product = z.infer<typeof productSchema>;

export type Price = z.infer<typeof priceSchema>;

export type CreateProductData = z.infer<typeof createProductSchema>;

export type UpdateProductData = z.infer<typeof updateProductSchema>;

export type ProductFeature = z.infer<typeof productFeatureSchema>;

export type ProductFeatureWrite = z.infer<typeof productFeatureWriteSchema>;
