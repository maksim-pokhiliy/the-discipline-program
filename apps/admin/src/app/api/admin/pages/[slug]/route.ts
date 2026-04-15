import {
  createGetByParamHandler,
  createPatchByParamHandler,
  RATE_LIMIT_TIER,
  withAuthRateLimit,
} from "@repo/api-routes";
import { cmsPagesAdminApi } from "@repo/api-server/cms";
import {
  adminPageDetailsSchema,
  pageSlugRouteParamsSchema,
  updatePageMetadataSchema,
} from "@repo/contracts/cms/pages";

import { withAdminAuth } from "@app/lib/server/auth";

export const GET = withAdminAuth(
  withAuthRateLimit(
    createGetByParamHandler(
      ({ slug }) => cmsPagesAdminApi.getPageBySlug(slug),
      pageSlugRouteParamsSchema,
      adminPageDetailsSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const PATCH = withAdminAuth(
  withAuthRateLimit(
    createPatchByParamHandler(
      ({ slug }, data) => cmsPagesAdminApi.updatePageMetadata(slug, data),
      pageSlugRouteParamsSchema,
      updatePageMetadataSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);
