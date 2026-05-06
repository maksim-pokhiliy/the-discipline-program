import { createAuthActionHandler, withAuthRateLimit, RATE_LIMIT_TIER } from "@repo/api-routes";
import { lmsPlanEnrollmentApi } from "@repo/api-server/lms";
import {
  planEnrollmentParamsSchema,
  resumePlanEnrollmentResponseSchema,
} from "@repo/contracts/lms/plan-enrollment";

import { withCoachAuth } from "@app/lib/server/auth";

export const POST = withCoachAuth(
  withAuthRateLimit(
    createAuthActionHandler(
      (userId, { planId, enrollmentId }) =>
        lmsPlanEnrollmentApi.resume(userId, planId, enrollmentId),
      planEnrollmentParamsSchema,
      resumePlanEnrollmentResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
