import {
  createAuthGetHandler,
  createAuthPostHandler,
  RATE_LIMIT_TIER,
  withAuthRateLimit,
} from "@repo/api-routes";
import { lmsExercisePlatformApi } from "@repo/api-server/lms";
import {
  createExerciseRequestSchema,
  exerciseSchema,
  getExercisesResponseSchema,
} from "@repo/contracts/lms/exercise";

import { withCoachAuth } from "@app/lib/server/auth";

export const GET = withCoachAuth(
  withAuthRateLimit(
    createAuthGetHandler(
      (userId) => lmsExercisePlatformApi.list(userId),
      getExercisesResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const POST = withCoachAuth(
  withAuthRateLimit(
    createAuthPostHandler(
      (userId, data) => lmsExercisePlatformApi.create(userId, data),
      createExerciseRequestSchema,
      exerciseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
