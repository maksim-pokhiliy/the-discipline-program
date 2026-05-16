import { createAuthPutByParamHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { lmsDayMetadataApi } from "@repo/api-server/lms";
import {
  dayByAddressParamsSchema,
  updateDayLabelRequestSchema,
  updateDayLabelResponseSchema,
} from "@repo/contracts/lms/day";

import { withCoachAuth } from "@app/lib/server/auth";

export const PUT = withCoachAuth(
  withAuthRateLimit(
    createAuthPutByParamHandler(
      (userId, { planId, startDate, dayOfWeek }, data) =>
        lmsDayMetadataApi.setLabel(userId, planId, startDate, dayOfWeek, data),
      dayByAddressParamsSchema,
      updateDayLabelRequestSchema,
      updateDayLabelResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
