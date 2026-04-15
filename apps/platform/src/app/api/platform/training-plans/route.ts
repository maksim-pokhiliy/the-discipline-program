import {
  createAuthGetHandler,
  createAuthPostHandler,
  withAuthRateLimit,
  RATE_LIMIT_TIER,
} from "@repo/api-routes";
import { lmsTrainingPlanApi } from "@repo/api-server/lms";
import {
  coachPlansPageDataSchema,
  createTrainingPlanRequestSchema,
  createTrainingPlanResponseSchema,
} from "@repo/contracts/lms/training-plan";

import { withCoachAuth } from "@app/lib/server/auth";

export const GET = withCoachAuth(
  withAuthRateLimit(
    createAuthGetHandler(
      (userId) => lmsTrainingPlanApi.getPageData(userId),
      coachPlansPageDataSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const POST = withCoachAuth(
  withAuthRateLimit(
    createAuthPostHandler(
      (userId, data) => lmsTrainingPlanApi.create(userId, data),
      createTrainingPlanRequestSchema,
      createTrainingPlanResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
