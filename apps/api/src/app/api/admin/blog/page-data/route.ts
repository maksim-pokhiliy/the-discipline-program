import { adminBlogApi } from "@repo/api-server";
import { getBlogPageDataResponseSchema } from "@repo/contracts/blog";

import { withAdminAuth } from "@app/lib/auth";
import { createGetHandler } from "@app/lib/route-helpers";

export const GET = withAdminAuth(
  createGetHandler(adminBlogApi.getBlogPageData, getBlogPageDataResponseSchema),
);
