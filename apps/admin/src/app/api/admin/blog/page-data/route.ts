import { createGetHandler } from "@repo/api-routes";
import { cmsBlogAdminApi } from "@repo/api-server/cms";
import { getBlogPageDataResponseSchema } from "@repo/contracts/cms/blog";

import { withAdminAuth } from "@app/lib/server/auth";

export const GET = withAdminAuth(
  createGetHandler(cmsBlogAdminApi.getBlogPageData, getBlogPageDataResponseSchema),
);
