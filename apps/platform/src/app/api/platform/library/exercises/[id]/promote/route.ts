import { createAuthActionHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { lmsExerciseLibraryItemApi } from "@repo/api-server/lms/exercise-library-item";
import { idParamSchema } from "@repo/contracts/common";
import { promoteExerciseLibraryItemResponseSchema } from "@repo/contracts/lms/exercise-library-item";

import { withCoachAuth } from "@app/lib/server/auth";

export const POST = withCoachAuth(
  withAuthRateLimit(
    createAuthActionHandler(
      (actorId, { id }) => lmsExerciseLibraryItemApi.promote(actorId, id),
      idParamSchema,
      promoteExerciseLibraryItemResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
