import { createAuthPostByParamHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { lmsTrainingPlanPatchApi } from "@repo/api-server/lms";
import {
  bulkPatchPlanInputSchema,
  bulkPatchPlanParamsSchema,
  bulkPatchPlanResponseSchema,
} from "@repo/contracts/lms/training-plan";

import { withCoachAuth } from "@app/lib/server/auth";

export const POST = withCoachAuth(
  withAuthRateLimit(
    createAuthPostByParamHandler(
      (userId, { planId }, data) => lmsTrainingPlanPatchApi.patch(userId, planId, data),
      bulkPatchPlanParamsSchema,
      bulkPatchPlanInputSchema,
      bulkPatchPlanResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
