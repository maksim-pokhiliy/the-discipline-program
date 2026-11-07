import { createAuthPutHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { cmsLocaleAdminApi } from "@repo/api-server/cms";
import {
  reorderLocalesRequestSchema,
  reorderLocalesResponseSchema,
} from "@repo/contracts/cms/locale";

import { withAdminAuth } from "@app/lib/server/auth";

export const PUT = withAdminAuth(
  withAuthRateLimit(
    createAuthPutHandler(
      (_actorId, data) => cmsLocaleAdminApi.reorderLocales(data),
      reorderLocalesRequestSchema,
      reorderLocalesResponseSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
