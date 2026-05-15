import {
  createGetHandler,
  createPostHandler,
  RATE_LIMIT_TIER,
  withAuthRateLimit,
} from "@repo/api-routes";
import { cmsExerciseAdminApi } from "@repo/api-server/cms";
import {
  createExerciseRequestSchema,
  exerciseSchema,
  getExercisesResponseSchema,
} from "@repo/contracts/cms/exercise";

import { withAdminAuth } from "@app/lib/server/auth";

export const GET = withAdminAuth(
  withAuthRateLimit(
    createGetHandler(cmsExerciseAdminApi.getExercises, getExercisesResponseSchema),
    RATE_LIMIT_TIER.API,
  ),
);
export const POST = withAdminAuth(
  withAuthRateLimit(
    createPostHandler(
      cmsExerciseAdminApi.createExercise,
      createExerciseRequestSchema,
      exerciseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
