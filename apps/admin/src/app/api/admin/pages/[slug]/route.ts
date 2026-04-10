import { createGetByParamHandler, createPatchByParamHandler } from "@repo/api-routes";
import { cmsPagesAdminApi } from "@repo/api-server/cms";
import {
  adminPageDetailsSchema,
  pageSlugRouteParamsSchema,
  updatePageMetadataSchema,
} from "@repo/contracts/cms/pages";

import { withAdminAuth } from "@app/lib/server/auth";

export const GET = withAdminAuth(
  createGetByParamHandler(
    ({ slug }) => cmsPagesAdminApi.getPageBySlug(slug),
    pageSlugRouteParamsSchema,
    adminPageDetailsSchema,
  ),
);

export const PATCH = withAdminAuth(
  createPatchByParamHandler(
    ({ slug }, data) => cmsPagesAdminApi.updatePageMetadata(slug, data),
    pageSlugRouteParamsSchema,
    updatePageMetadataSchema,
  ),
);
