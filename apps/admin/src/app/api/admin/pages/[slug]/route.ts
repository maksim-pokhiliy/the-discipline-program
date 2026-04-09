import { createGetByParamHandler, createPatchByParamHandler } from "@repo/api-routes";
import { adminPagesApi } from "@repo/api-server";
import {
  adminPageDetailsSchema,
  pageSlugRouteParamsSchema,
  updatePageMetadataSchema,
} from "@repo/contracts/pages";

import { withAdminAuth } from "@app/lib/server/auth";

export const GET = withAdminAuth(
  createGetByParamHandler(
    ({ slug }) => adminPagesApi.getPageBySlug(slug),
    pageSlugRouteParamsSchema,
    adminPageDetailsSchema,
  ),
);

export const PATCH = withAdminAuth(
  createPatchByParamHandler(
    ({ slug }, data) => adminPagesApi.updatePageMetadata(slug, data),
    pageSlugRouteParamsSchema,
    updatePageMetadataSchema,
  ),
);
