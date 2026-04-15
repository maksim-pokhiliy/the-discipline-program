import { createGetHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { iamUserAdminApi } from "@repo/api-server/iam";
import { getUsersPageDataResponseSchema } from "@repo/contracts/iam/user";

import { withAdminAuth } from "@app/lib/server/auth";

export const GET = withAdminAuth(
  withAuthRateLimit(
    createGetHandler(iamUserAdminApi.getPageData, getUsersPageDataResponseSchema),
    RATE_LIMIT_TIER.API,
  ),
);
