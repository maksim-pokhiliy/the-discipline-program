import { createAuthGetHandler, createAuthPostHandler } from "@repo/api-routes";
import { lmsWorkoutLogApi } from "@repo/api-server/lms";
import {
  createWorkoutLogRequestSchema,
  createWorkoutLogResponseSchema,
  getWorkoutLogsResponseSchema,
} from "@repo/contracts/lms/workout-log";

import { withPlatformAuth } from "@app/lib/server/auth";

export const GET = withPlatformAuth(
  createAuthGetHandler((userId) => lmsWorkoutLogApi.getAll(userId), getWorkoutLogsResponseSchema),
);

export const POST = withPlatformAuth(
  createAuthPostHandler(
    (userId, data) => lmsWorkoutLogApi.create(userId, data),
    createWorkoutLogRequestSchema,
    createWorkoutLogResponseSchema,
  ),
);
