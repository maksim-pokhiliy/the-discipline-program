import { createPatchByParamHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { cmsProductTranslationAdminApi } from "@repo/api-server/cms";
import {
  updateProductTranslationBodySchema,
  updateProductTranslationParamsSchema,
} from "@repo/contracts/cms/product";

import { withAdminAuth } from "@app/lib/server/auth";

export const PATCH = withAdminAuth(
  withAuthRateLimit(
    createPatchByParamHandler(
      async ({ id }, body) => {
        await cmsProductTranslationAdminApi.saveTranslation({ ...body, productId: id });
      },
      updateProductTranslationParamsSchema,
      updateProductTranslationBodySchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
