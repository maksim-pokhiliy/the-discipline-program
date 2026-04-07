import { createGetHandler, createPostHandler } from "@repo/api-routes";
import { adminBlogApi } from "@repo/api-server";
import { createBlogPostRequestSchema, getBlogPostsResponseSchema } from "@repo/contracts/blog";

import { withAdminAuth } from "@app/lib/auth";

export const GET = withAdminAuth(
  createGetHandler(adminBlogApi.getPosts, getBlogPostsResponseSchema),
);
export const POST = withAdminAuth(
  createPostHandler(adminBlogApi.createPost, createBlogPostRequestSchema),
);
