import {
  createGetHandler,
  withPublicRoute,
  withRateLimit,
  RATE_LIMIT_TIER,
} from "@repo/api-routes";
import { cmsLocalePublicApi } from "@repo/api-server/cms";
import { getPublicLocalesResponseSchema } from "@repo/contracts/cms/locale";

export const GET = withPublicRoute(
  withRateLimit(
    createGetHandler(cmsLocalePublicApi.getEnabledLocales, getPublicLocalesResponseSchema),
    RATE_LIMIT_TIER.PUBLIC,
  ),
);
