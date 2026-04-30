import {
  createAuthDeleteHandler,
  createAuthGetByParamHandler,
  createAuthPutByParamHandler,
  RATE_LIMIT_TIER,
  withAuthRateLimit,
} from "@repo/api-routes";
import { lmsPlanOverrideApi } from "@repo/api-server/lms";
import {
  getPlanOverrideResponseSchema,
  overrideIdParamSchema,
  updatePlanOverrideInputSchema,
  updatePlanOverrideResponseSchema,
} from "@repo/contracts/lms/plan-override";

import { withCoachAuth } from "@app/lib/server/auth";

export const GET = withCoachAuth(
  withAuthRateLimit(
    createAuthGetByParamHandler(
      (userId, { overrideId }) => lmsPlanOverrideApi.getById(userId, overrideId),
      overrideIdParamSchema,
      getPlanOverrideResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const PUT = withCoachAuth(
  withAuthRateLimit(
    createAuthPutByParamHandler(
      (userId, { overrideId }, data) => lmsPlanOverrideApi.update(userId, overrideId, data),
      overrideIdParamSchema,
      updatePlanOverrideInputSchema,
      updatePlanOverrideResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const DELETE = withCoachAuth(
  withAuthRateLimit(
    createAuthDeleteHandler(
      (userId, { overrideId }) => lmsPlanOverrideApi.deleteById(userId, overrideId),
      overrideIdParamSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
