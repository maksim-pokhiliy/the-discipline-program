import { createGetHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { cmsProductAdminApi } from "@repo/api-server/cms";
import { getProductsPageDataResponseSchema } from "@repo/contracts/cms/product";

import { withAdminAuth } from "@app/lib/server/auth";

export const GET = withAdminAuth(
  withAuthRateLimit(
    createGetHandler(cmsProductAdminApi.getPageData, getProductsPageDataResponseSchema),
    RATE_LIMIT_TIER.API,
  ),
);
