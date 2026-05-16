import { createGetHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { cmsExerciseAdminApi } from "@repo/api-server/lms";
import { getMovementFamiliesResponseSchema } from "@repo/contracts/lms/exercise";

import { withAdminAuth } from "@app/lib/server/auth";

export const GET = withAdminAuth(
  withAuthRateLimit(
    createGetHandler(cmsExerciseAdminApi.getMovementFamilies, getMovementFamiliesResponseSchema),
    RATE_LIMIT_TIER.API,
  ),
);
