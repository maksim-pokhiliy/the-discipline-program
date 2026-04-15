import { createAuthActionHandler, withAuthRateLimit, RATE_LIMIT_TIER } from "@repo/api-routes";
import { lmsTrainingPlanApi } from "@repo/api-server/lms";
import {
  getTrainingPlanByIdParamsSchema,
  updateTrainingPlanResponseSchema,
} from "@repo/contracts/lms/training-plan";

import { withPlatformAuth } from "@app/lib/server/auth";

export const POST = withPlatformAuth(
  withAuthRateLimit(
    createAuthActionHandler(
      (userId, { planId }) => lmsTrainingPlanApi.activate(userId, planId),
      getTrainingPlanByIdParamsSchema,
      updateTrainingPlanResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
