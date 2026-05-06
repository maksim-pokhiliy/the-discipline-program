import { createGetHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { lmsDayTypeAdminApi } from "@repo/api-server/lms";
import { getDayTypesPageDataResponseSchema } from "@repo/contracts/lms/day-type";

import { withAdminAuth } from "@app/lib/server/auth";

export const GET = withAdminAuth(
  withAuthRateLimit(
    createGetHandler(lmsDayTypeAdminApi.getDayTypesPageData, getDayTypesPageDataResponseSchema),
    RATE_LIMIT_TIER.API,
  ),
);
