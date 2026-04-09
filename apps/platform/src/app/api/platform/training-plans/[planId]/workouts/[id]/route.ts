import {
  createAuthDeleteHandler,
  createAuthGetByParamHandler,
  createAuthPutByParamHandler,
} from "@repo/api-routes";
import { platformWorkoutsApi } from "@repo/api-server";
import {
  deleteWorkoutParamsSchema,
  getWorkoutByIdParamsSchema,
  getWorkoutResponseSchema,
  updateWorkoutParamsSchema,
  updateWorkoutRequestSchema,
  updateWorkoutResponseSchema,
} from "@repo/contracts/workout";

import { withPlatformAuth } from "@app/lib/server/auth";

export const GET = withPlatformAuth(
  createAuthGetByParamHandler(
    (userId, { planId, id }) => platformWorkoutsApi.getById(userId, planId, id),
    getWorkoutByIdParamsSchema,
    getWorkoutResponseSchema,
  ),
);

export const PUT = withPlatformAuth(
  createAuthPutByParamHandler(
    (userId, { planId, id }, data) => platformWorkoutsApi.update(userId, planId, id, data),
    updateWorkoutParamsSchema,
    updateWorkoutRequestSchema,
    updateWorkoutResponseSchema,
  ),
);

export const DELETE = withPlatformAuth(
  createAuthDeleteHandler(
    (userId, { planId, id }) => platformWorkoutsApi.delete(userId, planId, id),
    deleteWorkoutParamsSchema,
  ),
);
