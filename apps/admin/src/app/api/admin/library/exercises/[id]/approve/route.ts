import { createAuthActionHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { libraryExerciseAdminApi } from "@repo/api-server/library";
import {
  approveExerciseParamsSchema,
  approveExerciseResponseSchema,
} from "@repo/contracts/library/exercise";

import { withAdminAuth } from "@app/lib/server/auth";

export const POST = withAdminAuth(
  withAuthRateLimit(
    createAuthActionHandler(
      (actorId, { id }) => libraryExerciseAdminApi.approve({ id, reviewerUserId: actorId }),
      approveExerciseParamsSchema,
      approveExerciseResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
