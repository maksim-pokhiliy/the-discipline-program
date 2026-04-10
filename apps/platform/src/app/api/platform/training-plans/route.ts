import { createAuthGetHandler, createAuthPostHandler } from "@repo/api-routes";
import { lmsTrainingPlanApi } from "@repo/api-server/lms";
import {
  coachPlansPageDataSchema,
  createTrainingPlanRequestSchema,
  createTrainingPlanResponseSchema,
} from "@repo/contracts/lms/training-plan";

import { withPlatformAuth } from "@app/lib/server/auth";

export const GET = withPlatformAuth(
  createAuthGetHandler(
    (userId) => lmsTrainingPlanApi.getPageData(userId),
    coachPlansPageDataSchema,
  ),
);

export const POST = withPlatformAuth(
  createAuthPostHandler(
    (userId, data) => lmsTrainingPlanApi.create(userId, data),
    createTrainingPlanRequestSchema,
    createTrainingPlanResponseSchema,
  ),
);
