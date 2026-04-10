import { createAuthGetByParamHandler, createAuthPostByParamHandler } from "@repo/api-routes";
import { lmsWorkoutApi } from "@repo/api-server/lms";
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
    (userId, { planId }) => lmsWorkoutApi.getAll(userId, planId),
    getWorkoutsParamsSchema,
    getWorkoutsResponseSchema,
  ),
);

export const POST = withPlatformAuth(
  createAuthPostByParamHandler(
    (userId, { planId }, data) => lmsWorkoutApi.create(userId, planId, data),
    createWorkoutParamsSchema,
    createWorkoutRequestSchema,
    createWorkoutResponseSchema,
  ),
);
