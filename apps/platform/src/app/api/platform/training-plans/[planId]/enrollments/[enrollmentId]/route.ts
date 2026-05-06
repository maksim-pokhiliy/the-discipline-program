import {
  createAuthDeleteHandler,
  createAuthGetByParamHandler,
  withAuthRateLimit,
  RATE_LIMIT_TIER,
} from "@repo/api-routes";
import { lmsPlanEnrollmentApi } from "@repo/api-server/lms";
import {
  getPlanEnrollmentResponseSchema,
  planEnrollmentParamsSchema,
} from "@repo/contracts/lms/plan-enrollment";

import { withCoachAuth } from "@app/lib/server/auth";

export const GET = withCoachAuth(
  withAuthRateLimit(
    createAuthGetByParamHandler(
      (userId, { planId, enrollmentId }) =>
        lmsPlanEnrollmentApi.getById(userId, planId, enrollmentId),
      planEnrollmentParamsSchema,
      getPlanEnrollmentResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const DELETE = withCoachAuth(
  withAuthRateLimit(
    createAuthDeleteHandler(
      (userId, { planId, enrollmentId }) =>
        lmsPlanEnrollmentApi.remove(userId, planId, enrollmentId),
      planEnrollmentParamsSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
