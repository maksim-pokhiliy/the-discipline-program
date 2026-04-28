import { createAuthPostByParamHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { lmsExerciseLibraryItemApi } from "@repo/api-server/lms/exercise-library-item";
import { idParamSchema } from "@repo/contracts/common";
import {
  demoteExerciseLibraryItemInputSchema,
  demoteExerciseLibraryItemResponseSchema,
} from "@repo/contracts/lms/exercise-library-item";

import { withCoachAuth } from "@app/lib/server/auth";

export const POST = withCoachAuth(
  withAuthRateLimit(
    createAuthPostByParamHandler(
      (actorId, { id }, data) => lmsExerciseLibraryItemApi.demote(actorId, id, data),
      idParamSchema,
      demoteExerciseLibraryItemInputSchema,
      demoteExerciseLibraryItemResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
