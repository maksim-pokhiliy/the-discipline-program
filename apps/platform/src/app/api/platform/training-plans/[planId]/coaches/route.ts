import {
  createAuthGetByParamHandler,
  createAuthPostByParamHandler,
  withAuthRateLimit,
  RATE_LIMIT_TIER,
} from "@repo/api-routes";
import { lmsPlanCoachAssignmentApi } from "@repo/api-server/lms";
import {
  createPlanCoachAssignmentParamsSchema,
  createPlanCoachAssignmentRequestSchema,
  createPlanCoachAssignmentResponseSchema,
  listPlanCoachAssignmentsParamsSchema,
  listPlanCoachAssignmentsResponseSchema,
} from "@repo/contracts/lms/plan-coach-assignment";

import { withCoachAuth } from "@app/lib/server/auth";

export const GET = withCoachAuth(
  withAuthRateLimit(
    createAuthGetByParamHandler(
      (userId, { planId }) => lmsPlanCoachAssignmentApi.list(userId, planId),
      listPlanCoachAssignmentsParamsSchema,
      listPlanCoachAssignmentsResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const POST = withCoachAuth(
  withAuthRateLimit(
    createAuthPostByParamHandler(
      (userId, { planId }, data) => lmsPlanCoachAssignmentApi.create(userId, planId, data),
      createPlanCoachAssignmentParamsSchema,
      createPlanCoachAssignmentRequestSchema,
      createPlanCoachAssignmentResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
