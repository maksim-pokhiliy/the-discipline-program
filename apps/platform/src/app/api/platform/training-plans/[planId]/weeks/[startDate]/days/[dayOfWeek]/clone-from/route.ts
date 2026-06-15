import { createAuthPostByParamHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { lmsDayMetadataApi } from "@repo/api-server/lms";
import {
  cloneDayFromRequestSchema,
  cloneDayResponseSchema,
  dayByAddressParamsSchema,
} from "@repo/contracts/lms/day";

import { withCoachAuth } from "@app/lib/server/auth";

export const POST = withCoachAuth(
  withAuthRateLimit(
    createAuthPostByParamHandler(
      (userId, { planId, startDate, dayOfWeek }, { sourceStartDate, sourceDayOfWeek }) =>
        lmsDayMetadataApi.cloneFrom(userId, planId, startDate, dayOfWeek, {
          sourceStartDate,
          sourceDayOfWeek,
        }),
      dayByAddressParamsSchema,
      cloneDayFromRequestSchema,
      cloneDayResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
