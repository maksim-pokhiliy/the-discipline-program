import { createAuthGetHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { lmsExerciseAdminApi } from "@repo/api-server/lms";
import { getExercisesResponseSchema } from "@repo/contracts/lms/exercise";

import { withCoachAuth } from "@app/lib/server/auth";

export const GET = withCoachAuth(
  withAuthRateLimit(
    createAuthGetHandler(() => lmsExerciseAdminApi.getExercises(), getExercisesResponseSchema),
    RATE_LIMIT_TIER.API,
  ),
);
