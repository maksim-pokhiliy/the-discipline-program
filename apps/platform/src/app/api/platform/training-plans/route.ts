import { createAuthGetHandler, createAuthPostHandler } from "@repo/api-routes";
import { platformTrainingPlansApi } from "@repo/api-server/lms";
import {
  coachPlansPageDataSchema,
  createTrainingPlanRequestSchema,
  createTrainingPlanResponseSchema,
} from "@repo/contracts/lms/training-plan";

import { withPlatformAuth } from "@app/lib/server/auth";

export const GET = withPlatformAuth(
  createAuthGetHandler(
    (userId) => platformTrainingPlansApi.getPageData(userId),
    coachPlansPageDataSchema,
  ),
);

export const POST = withPlatformAuth(
  createAuthPostHandler(
    (userId, data) => platformTrainingPlansApi.create(userId, data),
    createTrainingPlanRequestSchema,
    createTrainingPlanResponseSchema,
  ),
);
