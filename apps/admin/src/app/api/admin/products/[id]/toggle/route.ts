import { createMultiToggleHandler } from "@repo/api-routes";
import { adminProductsApi } from "@repo/api-server";
import {
  ProductToggleField,
  toggleProductParamsSchema,
  toggleProductQuerySchema,
} from "@repo/contracts/product";

import { withAdminAuth } from "@app/lib/server/auth";

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
