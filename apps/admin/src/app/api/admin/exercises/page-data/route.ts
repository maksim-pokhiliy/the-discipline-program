import { createGetHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { lmsExerciseAdminApi } from "@repo/api-server/lms";
import { getExercisesPageDataResponseSchema } from "@repo/contracts/lms/exercise";

import { withAdminAuth } from "@app/lib/server/auth";

export const GET = withAdminAuth(
  withAuthRateLimit(
    createGetHandler(lmsExerciseAdminApi.getExercisesPageData, getExercisesPageDataResponseSchema),
    RATE_LIMIT_TIER.API,
  ),
);
