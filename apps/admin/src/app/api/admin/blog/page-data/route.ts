import { createGetHandler } from "@repo/api-routes";
import { withAdminAuth } from "@repo/api-routes/auth";
import { adminBlogApi } from "@repo/api-server";
import { getBlogPageDataResponseSchema } from "@repo/contracts/blog";

export const GET = withAdminAuth(
  createGetHandler(adminBlogApi.getBlogPageData, getBlogPageDataResponseSchema),
);
