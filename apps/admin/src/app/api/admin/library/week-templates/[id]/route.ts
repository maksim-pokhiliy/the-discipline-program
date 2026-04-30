import {
  createAuthDeleteHandler,
  createAuthGetByParamHandler,
  createAuthPutByParamHandler,
  RATE_LIMIT_TIER,
  withAuthRateLimit,
} from "@repo/api-routes";
import { lmsWeekTemplateApi } from "@repo/api-server/lms/week-template";
import { idParamSchema } from "@repo/contracts/common";
import {
  getWeekTemplateResponseSchema,
  updateWeekTemplateInputSchema,
  updateWeekTemplateResponseSchema,
} from "@repo/contracts/lms/week-template";

import { withAdminAuth } from "@app/lib/server/auth";

export const GET = withAdminAuth(
  withAuthRateLimit(
    createAuthGetByParamHandler(
      (actorId, { id }) => lmsWeekTemplateApi.getById(actorId, id),
      idParamSchema,
      getWeekTemplateResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const PUT = withAdminAuth(
  withAuthRateLimit(
    createAuthPutByParamHandler(
      (actorId, { id }, data) => lmsWeekTemplateApi.update(actorId, id, data),
      idParamSchema,
      updateWeekTemplateInputSchema,
      updateWeekTemplateResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const DELETE = withAdminAuth(
  withAuthRateLimit(
    createAuthDeleteHandler(
      (actorId, { id }) => lmsWeekTemplateApi.delete(actorId, id),
      idParamSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
