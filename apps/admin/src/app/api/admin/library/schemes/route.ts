import {
  createAuthGetWithQueryHandler,
  createAuthPostHandler,
  RATE_LIMIT_TIER,
  withAuthRateLimit,
} from "@repo/api-routes";
import { librarySchemeAdminApi } from "@repo/api-server/library";
import {
  createSchemeRequestSchema,
  createSchemeResponseSchema,
  getSchemesQuerySchema,
  getSchemesResponseSchema,
} from "@repo/contracts/library/scheme";

import { withAdminAuth } from "@app/lib/server/auth";

export const GET = withAdminAuth(
  withAuthRateLimit(
    createAuthGetWithQueryHandler(
      (_actorId, query) => librarySchemeAdminApi.list(query),
      getSchemesQuerySchema,
      getSchemesResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const POST = withAdminAuth(
  withAuthRateLimit(
    createAuthPostHandler(
      (_actorId, data) => librarySchemeAdminApi.create(data),
      createSchemeRequestSchema,
      createSchemeResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
