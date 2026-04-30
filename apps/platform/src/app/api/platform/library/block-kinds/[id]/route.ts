import {
  createAuthDeleteHandler,
  createAuthGetByParamHandler,
  createAuthPutByParamHandler,
  RATE_LIMIT_TIER,
  withAuthRateLimit,
} from "@repo/api-routes";
import { lmsBlockKindApi } from "@repo/api-server/lms/block-kind";
import { idParamSchema } from "@repo/contracts/common";
import {
  getBlockKindResponseSchema,
  updateBlockKindInputSchema,
  updateBlockKindResponseSchema,
} from "@repo/contracts/lms/block-kind";

import { withCoachAuth } from "@app/lib/server/auth";

export const GET = withCoachAuth(
  withAuthRateLimit(
    createAuthGetByParamHandler(
      (actorId, { id }) => lmsBlockKindApi.getById(actorId, id),
      idParamSchema,
      getBlockKindResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const PUT = withCoachAuth(
  withAuthRateLimit(
    createAuthPutByParamHandler(
      (actorId, { id }, data) => lmsBlockKindApi.update(actorId, id, data),
      idParamSchema,
      updateBlockKindInputSchema,
      updateBlockKindResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const DELETE = withCoachAuth(
  withAuthRateLimit(
    createAuthDeleteHandler(
      (actorId, { id }) => lmsBlockKindApi.delete(actorId, id),
      idParamSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
