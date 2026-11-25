import { type z } from "zod";

import {
  type getProductsResponseSchema,
  type getProductByIdParamsSchema,
  type getProductQuerySchema,
  type getProductResponseSchema,
  type createProductRequestSchema,
  type updateProductParamsSchema,
  type updateProductRequestSchema,
  type updateProductTranslationBodySchema,
  type updateProductTranslationParamsSchema,
  type deleteProductParamsSchema,
  type toggleProductParamsSchema,
  type toggleProductQuerySchema,
  type getProductsPageDataResponseSchema,
} from "./product-api.schema";

export type GetProductsResponse = z.infer<typeof getProductsResponseSchema>;

export type GetProductByIdParams = z.infer<typeof getProductByIdParamsSchema>;
export type GetProductQuery = z.infer<typeof getProductQuerySchema>;
export type GetProductResponse = z.infer<typeof getProductResponseSchema>;
export type UpdateProductTranslationParams = z.infer<typeof updateProductTranslationParamsSchema>;
export type UpdateProductTranslationBody = z.input<typeof updateProductTranslationBodySchema>;

export type CreateProductRequest = z.infer<typeof createProductRequestSchema>;

export type UpdateProductParams = z.infer<typeof updateProductParamsSchema>;

export type UpdateProductRequest = z.infer<typeof updateProductRequestSchema>;

export type DeleteProductParams = z.infer<typeof deleteProductParamsSchema>;

export type ToggleProductParams = z.infer<typeof toggleProductParamsSchema>;

export type ToggleProductQuery = z.infer<typeof toggleProductQuerySchema>;

export type GetProductsPageDataResponse = z.infer<typeof getProductsPageDataResponseSchema>;

export type AdminProductsPageData = GetProductsPageDataResponse;
