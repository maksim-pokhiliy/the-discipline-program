import { createAuthDeleteHandler, createAuthGetByParamHandler } from "@repo/api-routes";
import { lmsWorkoutLogApi } from "@repo/api-server/lms";
import {
  deleteWorkoutLogParamsSchema,
  getWorkoutLogByIdParamsSchema,
  getWorkoutLogResponseSchema,
} from "@repo/contracts/lms/workout-log";

import { withPlatformAuth } from "@app/lib/server/auth";

export const GET = withPlatformAuth(
  createAuthGetByParamHandler(
    (userId, { id }) => lmsWorkoutLogApi.getById(userId, id),
    getWorkoutLogByIdParamsSchema,
    getWorkoutLogResponseSchema,
  ),
);

export const DELETE = withPlatformAuth(
  createAuthDeleteHandler(
    (userId, { id }) => lmsWorkoutLogApi.delete(userId, id),
    deleteWorkoutLogParamsSchema,
  ),
);
