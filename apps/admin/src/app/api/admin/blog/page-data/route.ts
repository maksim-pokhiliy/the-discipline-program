import { createGetHandler } from "@repo/api-routes";
import { adminBlogApi } from "@repo/api-server";
import { getBlogPageDataResponseSchema } from "@repo/contracts/cms/blog";

import { withAdminAuth } from "@app/lib/server/auth";

export const GET = withAdminAuth(
  createGetHandler(adminBlogApi.getBlogPageData, getBlogPageDataResponseSchema),
);
