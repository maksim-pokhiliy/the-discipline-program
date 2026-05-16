import {
  createAuthGetWithQueryHandler,
  RATE_LIMIT_TIER,
  withAuthRateLimit,
} from "@repo/api-routes";
import { lmsLabelPlatformApi } from "@repo/api-server/lms";
import { getLabelsResponseSchema, labelSearchParamsSchema } from "@repo/contracts/lms/label";

import { withCoachAuth } from "@app/lib/server/auth";

export const GET = withCoachAuth(
  withAuthRateLimit(
    createAuthGetWithQueryHandler(
      (userId, query) => lmsLabelPlatformApi.list(userId, query),
      labelSearchParamsSchema,
      getLabelsResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
