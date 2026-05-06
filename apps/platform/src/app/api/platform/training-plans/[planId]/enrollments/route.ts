import {
  createAuthGetByParamWithQueryHandler,
  createAuthPostByParamHandler,
  withAuthRateLimit,
  RATE_LIMIT_TIER,
} from "@repo/api-routes";
import { lmsPlanEnrollmentApi } from "@repo/api-server/lms";
import {
  createPlanEnrollmentRequestSchema,
  createPlanEnrollmentResponseSchema,
  getPlanEnrollmentsQuerySchema,
  getPlanEnrollmentsResponseSchema,
  planEnrollmentsByPlanParamsSchema,
} from "@repo/contracts/lms/plan-enrollment";

import { withCoachAuth } from "@app/lib/server/auth";

export const GET = withCoachAuth(
  withAuthRateLimit(
    createAuthGetByParamWithQueryHandler(
      async (userId, { planId }, query) => ({
        enrollments: await lmsPlanEnrollmentApi.listByPlan(
          userId,
          planId,
          query.status !== undefined ? { status: query.status } : {},
        ),
      }),
      planEnrollmentsByPlanParamsSchema,
      getPlanEnrollmentsQuerySchema,
      getPlanEnrollmentsResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const POST = withCoachAuth(
  withAuthRateLimit(
    createAuthPostByParamHandler(
      (userId, { planId }, data) => lmsPlanEnrollmentApi.create(userId, planId, data),
      planEnrollmentsByPlanParamsSchema,
      createPlanEnrollmentRequestSchema,
      createPlanEnrollmentResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
