import { createGetHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { cmsBlogAdminApi } from "@repo/api-server/cms";
import { getBlogPageDataResponseSchema } from "@repo/contracts/cms/blog";

import { withAdminAuth } from "@app/lib/server/auth";

export const GET = withAdminAuth(
  withAuthRateLimit(
    createGetHandler(cmsBlogAdminApi.getBlogPageData, getBlogPageDataResponseSchema),
    RATE_LIMIT_TIER.API,
  ),
);
