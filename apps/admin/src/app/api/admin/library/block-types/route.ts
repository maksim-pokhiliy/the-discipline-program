import {
  createAuthGetWithQueryHandler,
  createAuthPostHandler,
  RATE_LIMIT_TIER,
  withAuthRateLimit,
} from "@repo/api-routes";
import { libraryBlockTypeAdminApi } from "@repo/api-server/library";
import {
  createBlockTypeRequestSchema,
  createBlockTypeResponseSchema,
  getBlockTypesQuerySchema,
  getBlockTypesResponseSchema,
} from "@repo/contracts/library/block-type";

import { withAdminAuth } from "@app/lib/server/auth";

export const GET = withAdminAuth(
  withAuthRateLimit(
    createAuthGetWithQueryHandler(
      (_actorId, query) => libraryBlockTypeAdminApi.list(query),
      getBlockTypesQuerySchema,
      getBlockTypesResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const POST = withAdminAuth(
  withAuthRateLimit(
    createAuthPostHandler(
      (_actorId, data) => libraryBlockTypeAdminApi.create(data),
      createBlockTypeRequestSchema,
      createBlockTypeResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
