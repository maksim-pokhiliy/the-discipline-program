import { createAuthPostByParamHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { libraryExerciseAdminApi } from "@repo/api-server/library";
import {
  rejectExerciseParamsSchema,
  rejectExerciseRequestSchema,
  rejectExerciseResponseSchema,
} from "@repo/contracts/library/exercise";

import { withAdminAuth } from "@app/lib/server/auth";

export const POST = withAdminAuth(
  withAuthRateLimit(
    createAuthPostByParamHandler(
      (actorId, { id }, data) =>
        libraryExerciseAdminApi.reject({ id, reviewerUserId: actorId, input: data }),
      rejectExerciseParamsSchema,
      rejectExerciseRequestSchema,
      rejectExerciseResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
