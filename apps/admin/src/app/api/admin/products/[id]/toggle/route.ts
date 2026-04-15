import { createMultiToggleHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { cmsProductAdminApi } from "@repo/api-server/cms";
import {
  ProductToggleField,
  productSchema,
  toggleProductParamsSchema,
  toggleProductQuerySchema,
} from "@repo/contracts/cms/product";

import { withAdminAuth } from "@app/lib/server/auth";

export const PATCH = withAdminAuth(
  withAuthRateLimit(
    createMultiToggleHandler(
      {
        [ProductToggleField.IS_ACTIVE]: cmsProductAdminApi.toggleStatus,
        [ProductToggleField.IS_FEATURED]: cmsProductAdminApi.toggleFeatured,
      },
      toggleProductParamsSchema,
      toggleProductQuerySchema,
      productSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
