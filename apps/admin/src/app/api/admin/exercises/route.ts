import {
  createGetHandler,
  createPostHandler,
  RATE_LIMIT_TIER,
  withAuthRateLimit,
} from "@repo/api-routes";
import { lmsExerciseAdminApi } from "@repo/api-server/lms";
import {
  createExerciseRequestSchema,
  createExerciseResponseSchema,
  getExercisesResponseSchema,
} from "@repo/contracts/lms/exercise";

import { withAdminAuth } from "@app/lib/server/auth";

export const GET = withAdminAuth(
  withAuthRateLimit(
    createGetHandler(lmsExerciseAdminApi.getExercises, getExercisesResponseSchema),
    RATE_LIMIT_TIER.API,
  ),
);
export const POST = withAdminAuth(
  withAuthRateLimit(
    createPostHandler(
      lmsExerciseAdminApi.createExercise,
      createExerciseRequestSchema,
      createExerciseResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
