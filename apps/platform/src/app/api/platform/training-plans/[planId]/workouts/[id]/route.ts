import {
  createAuthDeleteHandler,
  createAuthGetByParamHandler,
  createAuthPutByParamHandler,
} from "@repo/api-routes";
import { lmsWorkoutApi } from "@repo/api-server/lms";
import {
  deleteWorkoutParamsSchema,
  getWorkoutByIdParamsSchema,
  getWorkoutResponseSchema,
  updateWorkoutParamsSchema,
  updateWorkoutRequestSchema,
  updateWorkoutResponseSchema,
} from "@repo/contracts/lms/workout";

import { withPlatformAuth } from "@app/lib/server/auth";

export const GET = withPlatformAuth(
  createAuthGetByParamHandler(
    (userId, { planId, id }) => lmsWorkoutApi.getById(userId, planId, id),
    getWorkoutByIdParamsSchema,
    getWorkoutResponseSchema,
  ),
);

export const PUT = withPlatformAuth(
  createAuthPutByParamHandler(
    (userId, { planId, id }, data) => lmsWorkoutApi.update(userId, planId, id, data),
    updateWorkoutParamsSchema,
    updateWorkoutRequestSchema,
    updateWorkoutResponseSchema,
  ),
);

export const DELETE = withPlatformAuth(
  createAuthDeleteHandler(
    (userId, { planId, id }) => lmsWorkoutApi.delete(userId, planId, id),
    deleteWorkoutParamsSchema,
  ),
);
