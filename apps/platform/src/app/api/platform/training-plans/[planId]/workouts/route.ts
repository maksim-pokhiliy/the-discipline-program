import { createAuthGetByParamHandler, createAuthPostByParamHandler } from "@repo/api-routes";
import { platformWorkoutsApi } from "@repo/api-server/lms";
import {
  createWorkoutParamsSchema,
  createWorkoutRequestSchema,
  createWorkoutResponseSchema,
  getWorkoutsParamsSchema,
  getWorkoutsResponseSchema,
} from "@repo/contracts/lms/workout";

import { withPlatformAuth } from "@app/lib/server/auth";

export const GET = withPlatformAuth(
  createAuthGetByParamHandler(
    (userId, { planId }) => platformWorkoutsApi.getAll(userId, planId),
    getWorkoutsParamsSchema,
    getWorkoutsResponseSchema,
  ),
);

export const POST = withPlatformAuth(
  createAuthPostByParamHandler(
    (userId, { planId }, data) => platformWorkoutsApi.create(userId, planId, data),
    createWorkoutParamsSchema,
    createWorkoutRequestSchema,
    createWorkoutResponseSchema,
  ),
);
