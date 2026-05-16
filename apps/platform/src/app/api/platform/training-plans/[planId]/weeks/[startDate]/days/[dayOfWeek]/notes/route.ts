import { createAuthPutByParamHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { lmsDayMetadataApi } from "@repo/api-server/lms";
import {
  dayByAddressParamsSchema,
  updateDayNotesRequestSchema,
  updateDayNotesResponseSchema,
} from "@repo/contracts/lms/day";

import { withCoachAuth } from "@app/lib/server/auth";

export const PUT = withCoachAuth(
  withAuthRateLimit(
    createAuthPutByParamHandler(
      (userId, { planId, startDate, dayOfWeek }, data) =>
        lmsDayMetadataApi.setNotes(userId, planId, startDate, dayOfWeek, data),
      dayByAddressParamsSchema,
      updateDayNotesRequestSchema,
      updateDayNotesResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
