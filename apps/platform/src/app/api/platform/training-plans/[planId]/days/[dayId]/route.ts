import {
  createAuthDeleteHandler,
  createAuthGetByParamHandler,
  createAuthPutByParamHandler,
  withAuthRateLimit,
  RATE_LIMIT_TIER,
} from "@repo/api-routes";
import { lmsPlanDayApi } from "@repo/api-server/lms";
import {
  getPlanDayResponseSchema,
  planDayParamsSchema,
  updatePlanDayRequestSchema,
  updatePlanDayResponseSchema,
} from "@repo/contracts/lms/plan-day";

import { withCoachAuth } from "@app/lib/server/auth";

export const GET = withCoachAuth(
  withAuthRateLimit(
    createAuthGetByParamHandler(
      (userId, { planId, dayId }) => lmsPlanDayApi.getById(userId, planId, dayId),
      planDayParamsSchema,
      getPlanDayResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const PUT = withCoachAuth(
  withAuthRateLimit(
    createAuthPutByParamHandler(
      (userId, { planId, dayId }, data) => lmsPlanDayApi.update(userId, planId, dayId, data),
      planDayParamsSchema,
      updatePlanDayRequestSchema,
      updatePlanDayResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const DELETE = withCoachAuth(
  withAuthRateLimit(
    createAuthDeleteHandler(
      (userId, { planId, dayId }) => lmsPlanDayApi.delete(userId, planId, dayId),
      planDayParamsSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
