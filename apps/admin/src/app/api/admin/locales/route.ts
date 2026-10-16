import {
  createGetHandler,
  createPostHandler,
  RATE_LIMIT_TIER,
  withAuthRateLimit,
} from "@repo/api-routes";
import { cmsLocaleAdminApi } from "@repo/api-server/cms";
import {
  createLocaleRequestSchema,
  getLocalesResponseSchema,
  localeSchema,
} from "@repo/contracts/cms/locale";

import { withAdminAuth } from "@app/lib/server/auth";

export const GET = withAdminAuth(
  withAuthRateLimit(
    createGetHandler(cmsLocaleAdminApi.getLocales, getLocalesResponseSchema),
    RATE_LIMIT_TIER.API,
  ),
);

export const POST = withAdminAuth(
  withAuthRateLimit(
    createPostHandler(cmsLocaleAdminApi.createLocale, createLocaleRequestSchema, localeSchema),
    RATE_LIMIT_TIER.API,
  ),
);
