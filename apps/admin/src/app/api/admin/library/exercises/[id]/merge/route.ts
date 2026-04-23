import { createAuthPostByParamHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { libraryExerciseAdminApi } from "@repo/api-server/library";
import {
  mergeExerciseParamsSchema,
  mergeExerciseRequestSchema,
  mergeExerciseResponseSchema,
} from "@repo/contracts/library/exercise";

import { withAdminAuth } from "@app/lib/server/auth";

export const POST = withAdminAuth(
  withAuthRateLimit(
    createAuthPostByParamHandler(
      (actorId, { id }, data) =>
        libraryExerciseAdminApi.merge({ sourceId: id, input: data, reviewerUserId: actorId }),
      mergeExerciseParamsSchema,
      mergeExerciseRequestSchema,
      mergeExerciseResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
