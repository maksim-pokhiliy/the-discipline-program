import {
  createAuthDeleteHandler,
  createAuthGetByParamHandler,
  createAuthPutByParamHandler,
  RATE_LIMIT_TIER,
  withAuthRateLimit,
} from "@repo/api-routes";
import { lmsSessionTemplateApi } from "@repo/api-server/lms/session-template";
import { idParamSchema } from "@repo/contracts/common";
import {
  getSessionTemplateResponseSchema,
  updateSessionTemplateInputSchema,
  updateSessionTemplateResponseSchema,
} from "@repo/contracts/lms/session-template";

import { withCoachAuth } from "@app/lib/server/auth";

export const GET = withCoachAuth(
  withAuthRateLimit(
    createAuthGetByParamHandler(
      (actorId, { id }) => lmsSessionTemplateApi.getById(actorId, id),
      idParamSchema,
      getSessionTemplateResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const PUT = withCoachAuth(
  withAuthRateLimit(
    createAuthPutByParamHandler(
      (actorId, { id }, data) => lmsSessionTemplateApi.update(actorId, id, data),
      idParamSchema,
      updateSessionTemplateInputSchema,
      updateSessionTemplateResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const DELETE = withCoachAuth(
  withAuthRateLimit(
    createAuthDeleteHandler(
      (actorId, { id }) => lmsSessionTemplateApi.delete(actorId, id),
      idParamSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
