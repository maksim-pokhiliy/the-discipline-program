import { z } from "zod";

import { idParamSchema } from "../../../common";
import { localeCodeSchema, localeQuerySchema } from "../locale";

import {
  adminProductDetailsSchema,
  adminProductListItemSchema,
  productTranslationWordsSchema,
} from "./product-translation.schema";
import { ProductToggleField } from "./product.constants";
import { createProductSchema, updateProductSchema } from "./product.schema";

export const getProductsResponseSchema = z.array(adminProductListItemSchema);

export const getProductByIdParamsSchema = idParamSchema;
export const getProductQuerySchema = localeQuerySchema;
export const getProductResponseSchema = adminProductDetailsSchema;

export const createProductRequestSchema = createProductSchema;

export const updateProductParamsSchema = idParamSchema;

export const updateProductRequestSchema = updateProductSchema;

export const updateProductTranslationParamsSchema = idParamSchema;
export const updateProductTranslationBodySchema = productTranslationWordsSchema.extend({
  locale: localeCodeSchema,
});

export const deleteProductParamsSchema = idParamSchema;

export const toggleProductParamsSchema = idParamSchema;

export const toggleProductQuerySchema = z.object({
  field: z.nativeEnum(ProductToggleField),
});

export const getProductsPageDataResponseSchema = z.object({
  products: getProductsResponseSchema,
});
