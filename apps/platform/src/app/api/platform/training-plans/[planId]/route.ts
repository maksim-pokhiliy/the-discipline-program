import {
  createAuthDeleteHandler,
  createAuthGetByParamHandler,
  createAuthPutByParamHandler,
} from "@repo/api-routes";
import { platformTrainingPlansApi } from "@repo/api-server";
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
    (userId, { planId }) => platformTrainingPlansApi.getById(userId, planId),
    getTrainingPlanByIdParamsSchema,
    getTrainingPlanResponseSchema,
  ),
);

export const PUT = withPlatformAuth(
  createAuthPutByParamHandler(
    (userId, { planId }, data) => platformTrainingPlansApi.update(userId, planId, data),
    updateTrainingPlanParamsSchema,
    updateTrainingPlanRequestSchema,
    updateTrainingPlanResponseSchema,
  ),
);

export const DELETE = withPlatformAuth(
  createAuthDeleteHandler(
    (userId, { planId }) => platformTrainingPlansApi.delete(userId, planId),
    deleteTrainingPlanParamsSchema,
  ),
);
