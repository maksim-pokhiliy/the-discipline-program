import {
  createAuthDeleteHandler,
  createPatchByParamHandler,
  RATE_LIMIT_TIER,
  withAuthRateLimit,
} from "@repo/api-routes";
import { cmsLocaleAdminApi } from "@repo/api-server/cms";
import { localeCodeParamsSchema, updateLocaleRequestSchema } from "@repo/contracts/cms/locale";

import { withAdminAuth } from "@app/lib/server/auth";

export const PATCH = withAdminAuth(
  withAuthRateLimit(
    createPatchByParamHandler(
      async ({ code }, data) => {
        await cmsLocaleAdminApi.updateLocale(code, data);
      },
      localeCodeParamsSchema,
      updateLocaleRequestSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const DELETE = withAdminAuth(
  withAuthRateLimit(
    createAuthDeleteHandler(
      (_actorId, { code }) => cmsLocaleAdminApi.deleteLocale(code),
      localeCodeParamsSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
