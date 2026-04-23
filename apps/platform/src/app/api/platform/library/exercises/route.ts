import {
  createAuthGetWithQueryHandler,
  createAuthPostHandler,
  RATE_LIMIT_TIER,
  withAuthRateLimit,
} from "@repo/api-routes";
import { libraryExerciseCoachApi } from "@repo/api-server/library";
import {
  createExerciseRequestSchema,
  createExerciseResponseSchema,
  getExercisesQuerySchema,
  getExercisesResponseSchema,
} from "@repo/contracts/library/exercise";

import { withCoachAuth } from "@app/lib/server/auth";

export const GET = withCoachAuth(
  withAuthRateLimit(
    createAuthGetWithQueryHandler(
      (userId, query) => libraryExerciseCoachApi.list({ userId, ...query }),
      getExercisesQuerySchema,
      getExercisesResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const POST = withCoachAuth(
  withAuthRateLimit(
    createAuthPostHandler(
      (userId, data) => libraryExerciseCoachApi.create({ userId, input: data }),
      createExerciseRequestSchema,
      createExerciseResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
