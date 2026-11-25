import { z } from "zod";

import { idParamSchema } from "../../../common";

import { ProductToggleField } from "./product.constants";
import { createProductSchema, updateProductSchema, adminProductSchema } from "./product.schema";

export const getProductsResponseSchema = z.array(adminProductSchema);

export const getProductByIdParamsSchema = idParamSchema;

export const createProductRequestSchema = createProductSchema;

export const updateProductParamsSchema = idParamSchema;

export const updateProductRequestSchema = updateProductSchema;

export const deleteProductParamsSchema = idParamSchema;

export const toggleProductParamsSchema = idParamSchema;

export const toggleProductQuerySchema = z.object({
  field: z.nativeEnum(ProductToggleField),
});

export const getProductsPageDataResponseSchema = z.object({
  products: getProductsResponseSchema,
});
