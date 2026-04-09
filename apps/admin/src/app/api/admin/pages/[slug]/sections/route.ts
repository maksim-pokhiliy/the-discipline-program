import { createPatchByParamHandler } from "@repo/api-routes";
import { adminPagesApi } from "@repo/api-server";
import { pageSlugRouteParamsSchema, updatePageSectionBodySchema } from "@repo/contracts/pages";

import { withAdminAuth } from "@app/lib/server/auth";

export const PATCH = withAdminAuth(
  createPatchByParamHandler(
    ({ slug }, body) => adminPagesApi.updateSection({ ...body, pageSlug: slug }),
    pageSlugRouteParamsSchema,
    updatePageSectionBodySchema,
  ),
);
