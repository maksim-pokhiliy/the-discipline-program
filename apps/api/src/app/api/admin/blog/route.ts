import { adminBlogApi } from "@repo/api-server";
import { createBlogPostRequestSchema, getBlogPostsResponseSchema } from "@repo/contracts/blog";

import { withAdminAuth } from "@app/lib/auth";
import { createGetHandler, createPostHandler } from "@app/lib/route-helpers";

export const GET = withAdminAuth(
  createGetHandler(adminBlogApi.getPosts, getBlogPostsResponseSchema),
);
export const POST = withAdminAuth(
  createPostHandler(adminBlogApi.createPost, createBlogPostRequestSchema),
);
