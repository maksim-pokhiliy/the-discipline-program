import {
  createGetHandler,
  createPostHandler,
  RATE_LIMIT_TIER,
  withAuthRateLimit,
} from "@repo/api-routes";
import { lmsSchemeTypeAdminApi } from "@repo/api-server/lms";
import {
  createSchemeTypeRequestSchema,
  createSchemeTypeResponseSchema,
  getSchemeTypesResponseSchema,
} from "@repo/contracts/lms/scheme-type";

import { withAdminAuth } from "@app/lib/server/auth";

export const GET = withAdminAuth(
  withAuthRateLimit(
    createGetHandler(lmsSchemeTypeAdminApi.getSchemeTypes, getSchemeTypesResponseSchema),
    RATE_LIMIT_TIER.API,
  ),
);
export const POST = withAdminAuth(
  withAuthRateLimit(
    createPostHandler(
      lmsSchemeTypeAdminApi.createSchemeType,
      createSchemeTypeRequestSchema,
      createSchemeTypeResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
