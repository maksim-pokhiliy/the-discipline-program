import { createGetHandler, createPostHandler } from "@repo/api-routes";
import { withAdminAuth } from "@repo/api-routes/auth";
import { adminBlogApi } from "@repo/api-server";
import { createBlogPostRequestSchema, getBlogPostsResponseSchema } from "@repo/contracts/blog";

export const GET = withAdminAuth(
  createGetHandler(adminBlogApi.getPosts, getBlogPostsResponseSchema),
);
export const POST = withAdminAuth(
  createPostHandler(adminBlogApi.createPost, createBlogPostRequestSchema),
);
