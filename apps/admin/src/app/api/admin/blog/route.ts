import { createGetHandler, createPostHandler } from "@repo/api-routes";
import { cmsBlogAdminApi } from "@repo/api-server/cms";
import { createBlogPostRequestSchema, getBlogPostsResponseSchema } from "@repo/contracts/cms/blog";

import { withAdminAuth } from "@app/lib/server/auth";

export const GET = withAdminAuth(
  createGetHandler(cmsBlogAdminApi.getPosts, getBlogPostsResponseSchema),
);
export const POST = withAdminAuth(
  createPostHandler(cmsBlogAdminApi.createPost, createBlogPostRequestSchema),
);
