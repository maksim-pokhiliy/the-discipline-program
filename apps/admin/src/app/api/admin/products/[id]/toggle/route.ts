import { createMultiToggleHandler } from "@repo/api-routes";
import { withAdminAuth } from "@repo/api-routes/auth";
import { adminProductsApi } from "@repo/api-server";
import {
  ProductToggleField,
  toggleProductParamsSchema,
  toggleProductQuerySchema,
} from "@repo/contracts/product";

export const PATCH = withAdminAuth(
  createMultiToggleHandler(
    {
      [ProductToggleField.IS_ACTIVE]: adminProductsApi.toggleStatus,
      [ProductToggleField.IS_FEATURED]: adminProductsApi.toggleFeatured,
    },
    toggleProductParamsSchema,
    toggleProductQuerySchema,
  ),
);
