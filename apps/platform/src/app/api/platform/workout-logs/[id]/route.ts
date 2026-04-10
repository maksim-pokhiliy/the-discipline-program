import { createAuthDeleteHandler, createAuthGetByParamHandler } from "@repo/api-routes";
import { platformWorkoutLogsApi } from "@repo/api-server";
import {
  deleteWorkoutLogParamsSchema,
  getWorkoutLogByIdParamsSchema,
  getWorkoutLogResponseSchema,
} from "@repo/contracts/lms/workout-log";

import { withPlatformAuth } from "@app/lib/server/auth";

export const GET = withPlatformAuth(
  createAuthGetByParamHandler(
    (userId, { id }) => platformWorkoutLogsApi.getById(userId, id),
    getWorkoutLogByIdParamsSchema,
    getWorkoutLogResponseSchema,
  ),
);

export const DELETE = withPlatformAuth(
  createAuthDeleteHandler(
    (userId, { id }) => platformWorkoutLogsApi.delete(userId, id),
    deleteWorkoutLogParamsSchema,
  ),
);
