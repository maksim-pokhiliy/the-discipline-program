import { type z } from "zod";

import {
  type getProductsResponseSchema,
  type getProductByIdParamsSchema,
  type createProductRequestSchema,
  type updateProductParamsSchema,
  type updateProductRequestSchema,
  type deleteProductParamsSchema,
  type toggleProductStatusParamsSchema,
  type getProductStatsResponseSchema,
  type getProductsPageDataResponseSchema,
} from "./product-api.schema";

export type GetProductsResponse = z.infer<typeof getProductsResponseSchema>;

export type GetProductByIdParams = z.infer<typeof getProductByIdParamsSchema>;

export type CreateProductRequest = z.infer<typeof createProductRequestSchema>;

export type UpdateProductParams = z.infer<typeof updateProductParamsSchema>;

export type UpdateProductRequest = z.infer<typeof updateProductRequestSchema>;

export type DeleteProductParams = z.infer<typeof deleteProductParamsSchema>;

export type ToggleProductStatusParams = z.infer<typeof toggleProductStatusParamsSchema>;

export type GetProductStatsResponse = z.infer<typeof getProductStatsResponseSchema>;

export type GetProductsPageDataResponse = z.infer<typeof getProductsPageDataResponseSchema>;
