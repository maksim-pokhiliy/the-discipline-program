import {
  createAuthDeleteHandler,
  createAuthGetByParamHandler,
  createAuthPutByParamHandler,
  RATE_LIMIT_TIER,
  withAuthRateLimit,
} from "@repo/api-routes";
import { libraryBlockTypeAdminApi } from "@repo/api-server/library";
import {
  deleteBlockTypeParamsSchema,
  getBlockTypeByIdParamsSchema,
  getBlockTypeResponseSchema,
  updateBlockTypeParamsSchema,
  updateBlockTypeRequestSchema,
  updateBlockTypeResponseSchema,
} from "@repo/contracts/library/block-type";

import { withAdminAuth } from "@app/lib/server/auth";

export const GET = withAdminAuth(
  withAuthRateLimit(
    createAuthGetByParamHandler(
      (_actorId, { id }) => libraryBlockTypeAdminApi.getById(id),
      getBlockTypeByIdParamsSchema,
      getBlockTypeResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const PUT = withAdminAuth(
  withAuthRateLimit(
    createAuthPutByParamHandler(
      (_actorId, { id }, data) => libraryBlockTypeAdminApi.update({ id, input: data }),
      updateBlockTypeParamsSchema,
      updateBlockTypeRequestSchema,
      updateBlockTypeResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const DELETE = withAdminAuth(
  withAuthRateLimit(
    createAuthDeleteHandler(
      (_actorId, { id }) => libraryBlockTypeAdminApi.delete(id),
      deleteBlockTypeParamsSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
