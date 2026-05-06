import { createAuthActionHandler, withAuthRateLimit, RATE_LIMIT_TIER } from "@repo/api-routes";
import { lmsPlanEnrollmentApi } from "@repo/api-server/lms";
import {
  pausePlanEnrollmentResponseSchema,
  planEnrollmentParamsSchema,
} from "@repo/contracts/lms/plan-enrollment";

import { withCoachAuth } from "@app/lib/server/auth";

export const POST = withCoachAuth(
  withAuthRateLimit(
    createAuthActionHandler(
      (userId, { planId, enrollmentId }) =>
        lmsPlanEnrollmentApi.pause(userId, planId, enrollmentId),
      planEnrollmentParamsSchema,
      pausePlanEnrollmentResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
