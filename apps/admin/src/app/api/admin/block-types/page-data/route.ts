import { createGetHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { lmsBlockTypeAdminApi } from "@repo/api-server/lms";
import { getBlockTypesPageDataResponseSchema } from "@repo/contracts/lms/block-type";

import { withAdminAuth } from "@app/lib/server/auth";

export const GET = withAdminAuth(
  withAuthRateLimit(
    createGetHandler(
      lmsBlockTypeAdminApi.getBlockTypesPageData,
      getBlockTypesPageDataResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
