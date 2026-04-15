import {
  createAuthGetByParamHandler,
  createAuthPostByParamHandler,
  withAuthRateLimit,
  RATE_LIMIT_TIER,
} from "@repo/api-routes";
import { coachingPlanRosterApi } from "@repo/api-server/coaching";
import { lmsPlanEnrollmentApi } from "@repo/api-server/lms";
import {
  getPlanRosterParamsSchema,
  getPlanRosterResponseSchema,
} from "@repo/contracts/coaching/plan-roster";
import {
  createPlanEnrollmentParamsSchema,
  createPlanEnrollmentRequestSchema,
  createPlanEnrollmentResponseSchema,
} from "@repo/contracts/lms/plan-enrollment";

import { withPlatformAuth } from "@app/lib/server/auth";

export const GET = withPlatformAuth(
  withAuthRateLimit(
    createAuthGetByParamHandler(
      (userId, { planId }) => coachingPlanRosterApi.list(userId, planId),
      getPlanRosterParamsSchema,
      getPlanRosterResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const POST = withPlatformAuth(
  withAuthRateLimit(
    createAuthPostByParamHandler(
      (userId, { planId }, data) => lmsPlanEnrollmentApi.create(userId, planId, data),
      createPlanEnrollmentParamsSchema,
      createPlanEnrollmentRequestSchema,
      createPlanEnrollmentResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
