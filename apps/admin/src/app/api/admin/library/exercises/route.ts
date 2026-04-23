import {
  createAuthGetWithQueryHandler,
  createAuthPostHandler,
  RATE_LIMIT_TIER,
  withAuthRateLimit,
} from "@repo/api-routes";
import { libraryExerciseAdminApi } from "@repo/api-server/library";
import {
  createExerciseRequestSchema,
  createExerciseResponseSchema,
  getExercisesQuerySchema,
  getExercisesResponseSchema,
} from "@repo/contracts/library/exercise";

import { withAdminAuth } from "@app/lib/server/auth";

export const GET = withAdminAuth(
  withAuthRateLimit(
    createAuthGetWithQueryHandler(
      (_actorId, query) => libraryExerciseAdminApi.list(query),
      getExercisesQuerySchema,
      getExercisesResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const POST = withAdminAuth(
  withAuthRateLimit(
    createAuthPostHandler(
      (actorId, data) => libraryExerciseAdminApi.create({ actorUserId: actorId, input: data }),
      createExerciseRequestSchema,
      createExerciseResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
