import {
  createAuthGetByParamHandler,
  createAuthPostByParamHandler,
  RATE_LIMIT_TIER,
  withAuthRateLimit,
} from "@repo/api-routes";
import { lmsPlanOverrideApi } from "@repo/api-server/lms";
import {
  createPlanOverrideBodySchema,
  createPlanOverrideResponseSchema,
  enrollmentOverrideParamSchema,
  listEnrollmentOverridesResponseSchema,
} from "@repo/contracts/lms/plan-override";

import { withCoachAuth } from "@app/lib/server/auth";

export const GET = withCoachAuth(
  withAuthRateLimit(
    createAuthGetByParamHandler(
      (userId, { enrollmentId }) => lmsPlanOverrideApi.listForEnrollment(userId, enrollmentId),
      enrollmentOverrideParamSchema,
      listEnrollmentOverridesResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const POST = withCoachAuth(
  withAuthRateLimit(
    createAuthPostByParamHandler(
      (userId, { enrollmentId }, data) =>
        lmsPlanOverrideApi.createForEnrollment(userId, enrollmentId, data),
      enrollmentOverrideParamSchema,
      createPlanOverrideBodySchema,
      createPlanOverrideResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
