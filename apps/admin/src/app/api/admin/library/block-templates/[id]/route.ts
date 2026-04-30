import {
  createAuthDeleteHandler,
  createAuthGetByParamHandler,
  createAuthPutByParamHandler,
  RATE_LIMIT_TIER,
  withAuthRateLimit,
} from "@repo/api-routes";
import { lmsBlockTemplateApi } from "@repo/api-server/lms/block-template";
import { idParamSchema } from "@repo/contracts/common";
import {
  getBlockTemplateResponseSchema,
  updateBlockTemplateInputSchema,
  updateBlockTemplateResponseSchema,
} from "@repo/contracts/lms/block-template";

import { withAdminAuth } from "@app/lib/server/auth";

export const GET = withAdminAuth(
  withAuthRateLimit(
    createAuthGetByParamHandler(
      (actorId, { id }) => lmsBlockTemplateApi.getById(actorId, id),
      idParamSchema,
      getBlockTemplateResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const PUT = withAdminAuth(
  withAuthRateLimit(
    createAuthPutByParamHandler(
      (actorId, { id }, data) => lmsBlockTemplateApi.update(actorId, id, data),
      idParamSchema,
      updateBlockTemplateInputSchema,
      updateBlockTemplateResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const DELETE = withAdminAuth(
  withAuthRateLimit(
    createAuthDeleteHandler(
      (actorId, { id }) => lmsBlockTemplateApi.delete(actorId, id),
      idParamSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
