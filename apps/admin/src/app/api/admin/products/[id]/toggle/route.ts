import { createMultiToggleHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import {
  ProductToggleField,
  adminProductSchema,
  toggleProductParamsSchema,
  toggleProductQuerySchema,
} from "@repo/contracts/cms/product";

import { withAdminAuth } from "@app/lib/server/auth";
import { cmsProductAdminApi } from "@app/lib/server/cms-product-admin-api";

export const PATCH = withAdminAuth(
  withAuthRateLimit(
    createMultiToggleHandler(
      {
        [ProductToggleField.IS_ACTIVE]: cmsProductAdminApi.toggleStatus,
        [ProductToggleField.IS_FEATURED]: cmsProductAdminApi.toggleFeatured,
      },
      toggleProductParamsSchema,
      toggleProductQuerySchema,
      adminProductSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
