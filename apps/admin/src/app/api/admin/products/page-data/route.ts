import { createGetHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { getProductsPageDataResponseSchema } from "@repo/contracts/cms/product";

import { withAdminAuth } from "@app/lib/server/auth";
import { cmsProductAdminApi } from "@app/lib/server/cms-product-admin-api";

export const GET = withAdminAuth(
  withAuthRateLimit(
    createGetHandler(cmsProductAdminApi.getPageData, getProductsPageDataResponseSchema),
    RATE_LIMIT_TIER.API,
  ),
);
