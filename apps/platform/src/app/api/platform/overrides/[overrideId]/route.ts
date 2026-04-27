import { createAuthDeleteHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { lmsPlanOverrideApi } from "@repo/api-server/lms";
import { overrideIdParamSchema } from "@repo/contracts/lms/plan-override";

import { withCoachAuth } from "@app/lib/server/auth";

export const DELETE = withCoachAuth(
  withAuthRateLimit(
    createAuthDeleteHandler(
      (userId, { overrideId }) => lmsPlanOverrideApi.deleteById(userId, overrideId),
      overrideIdParamSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
