import {
  createAuthDeleteHandler,
  createAuthGetByParamHandler,
  createAuthPutByParamHandler,
  RATE_LIMIT_TIER,
  withAuthRateLimit,
} from "@repo/api-routes";
import { lmsSchemeTemplateApi } from "@repo/api-server/lms/scheme-template";
import { idParamSchema } from "@repo/contracts/common";
import {
  getSchemeTemplateResponseSchema,
  updateSchemeTemplateInputSchema,
  updateSchemeTemplateResponseSchema,
} from "@repo/contracts/lms/scheme-template";

import { withAdminAuth } from "@app/lib/server/auth";

export const GET = withAdminAuth(
  withAuthRateLimit(
    createAuthGetByParamHandler(
      (actorId, { id }) => lmsSchemeTemplateApi.getById(actorId, id),
      idParamSchema,
      getSchemeTemplateResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const PUT = withAdminAuth(
  withAuthRateLimit(
    createAuthPutByParamHandler(
      (actorId, { id }, data) => lmsSchemeTemplateApi.update(actorId, id, data),
      idParamSchema,
      updateSchemeTemplateInputSchema,
      updateSchemeTemplateResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const DELETE = withAdminAuth(
  withAuthRateLimit(
    createAuthDeleteHandler(
      (actorId, { id }) => lmsSchemeTemplateApi.delete(actorId, id),
      idParamSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
