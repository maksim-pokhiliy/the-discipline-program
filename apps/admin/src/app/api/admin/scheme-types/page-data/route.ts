import { createGetHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { lmsSchemeTypeAdminApi } from "@repo/api-server/lms";
import { getSchemeTypesPageDataResponseSchema } from "@repo/contracts/lms/scheme-type";

import { withAdminAuth } from "@app/lib/server/auth";

export const GET = withAdminAuth(
  withAuthRateLimit(
    createGetHandler(
      lmsSchemeTypeAdminApi.getSchemeTypesPageData,
      getSchemeTypesPageDataResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
