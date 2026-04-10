import {
  createAuthDeleteHandler,
  createAuthGetByParamHandler,
  createAuthPutByParamHandler,
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

import { withPlatformAuth } from "@app/lib/server/auth";

export const GET = withPlatformAuth(
  createAuthGetByParamHandler(
    (userId, { planId }) => lmsTrainingPlanApi.getById(userId, planId),
    getTrainingPlanByIdParamsSchema,
    getTrainingPlanResponseSchema,
  ),
);

export const PUT = withPlatformAuth(
  createAuthPutByParamHandler(
    (userId, { planId }, data) => lmsTrainingPlanApi.update(userId, planId, data),
    updateTrainingPlanParamsSchema,
    updateTrainingPlanRequestSchema,
    updateTrainingPlanResponseSchema,
  ),
);

export const DELETE = withPlatformAuth(
  createAuthDeleteHandler(
    (userId, { planId }) => lmsTrainingPlanApi.delete(userId, planId),
    deleteTrainingPlanParamsSchema,
  ),
);
