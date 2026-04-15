import {
  createAuthDeleteHandler,
  createAuthGetByParamHandler,
  createAuthPutByParamHandler,
  withAuthRateLimit,
  RATE_LIMIT_TIER,
} from "@repo/api-routes";
import { lmsTrainingPlanApi } from "@repo/api-server/lms";
import {
  deleteTrainingPlanParamsSchema,
  getTrainingPlanByIdParamsSchema,
  getTrainingPlanResponseSchema,
  updateTrainingPlanParamsSchema,
  updateTrainingPlanRequestSchema,
  updateTrainingPlanResponseSchema,
} from "@repo/contracts/lms/training-plan";

import { withCoachAuth } from "@app/lib/server/auth";

export const GET = withCoachAuth(
  withAuthRateLimit(
    createAuthGetByParamHandler(
      (userId, { planId }) => lmsTrainingPlanApi.getById(userId, planId),
      getTrainingPlanByIdParamsSchema,
      getTrainingPlanResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const PUT = withCoachAuth(
  withAuthRateLimit(
    createAuthPutByParamHandler(
      (userId, { planId }, data) => lmsTrainingPlanApi.update(userId, planId, data),
      updateTrainingPlanParamsSchema,
      updateTrainingPlanRequestSchema,
      updateTrainingPlanResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const DELETE = withCoachAuth(
  withAuthRateLimit(
    createAuthDeleteHandler(
      (userId, { planId }) => lmsTrainingPlanApi.delete(userId, planId),
      deleteTrainingPlanParamsSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
