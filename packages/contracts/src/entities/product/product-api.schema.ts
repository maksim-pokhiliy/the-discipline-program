import { z } from "zod";

import { createProductSchema, updateProductSchema, productSchema } from "./product.schema";

export const getProductsResponseSchema = z.array(productSchema);

export const getProductByIdParamsSchema = z.object({
  id: z.string().cuid(),
});

export const createProductRequestSchema = createProductSchema;

export const updateProductParamsSchema = z.object({
  id: z.string().cuid(),
});

export const updateProductRequestSchema = updateProductSchema;

export const deleteProductParamsSchema = z.object({
  id: z.string().cuid(),
});

export const toggleProductStatusParamsSchema = z.object({
  id: z.string().cuid(),
});

export const getProductsPageDataResponseSchema = z.object({
  products: getProductsResponseSchema,
});
