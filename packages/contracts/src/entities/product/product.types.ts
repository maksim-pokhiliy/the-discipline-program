import { type z } from "zod";

import { type getProductsPageDataResponseSchema } from "./product-api.schema";
import {
  type productSchema,
  type priceSchema,
  type createProductSchema,
  type updateProductSchema,
} from "./product.schema";

export type Product = z.infer<typeof productSchema>;

export type Price = z.infer<typeof priceSchema>;

export type CreateProductData = z.infer<typeof createProductSchema>;

export type UpdateProductData = z.infer<typeof updateProductSchema>;

export type AdminProductsPageData = z.infer<typeof getProductsPageDataResponseSchema>;
