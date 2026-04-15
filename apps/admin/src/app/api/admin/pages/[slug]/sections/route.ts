import { createPatchByParamHandler, RATE_LIMIT_TIER, withAuthRateLimit } from "@repo/api-routes";
import { cmsPagesAdminApi } from "@repo/api-server/cms";
import { pageSlugRouteParamsSchema, updatePageSectionBodySchema } from "@repo/contracts/cms/pages";

import { withAdminAuth } from "@app/lib/server/auth";

export const PATCH = withAdminAuth(
  withAuthRateLimit(
    createPatchByParamHandler(
      ({ slug }, body) => cmsPagesAdminApi.updateSection({ ...body, pageSlug: slug }),
      pageSlugRouteParamsSchema,
      updatePageSectionBodySchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
