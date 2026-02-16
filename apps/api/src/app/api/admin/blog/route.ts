import { adminBlogApi } from "@repo/api-server";
import { createBlogPostRequestSchema, getBlogPostsResponseSchema } from "@repo/contracts/blog";

import { createGetHandler, createPostHandler } from "@app/lib/route-helpers";

export const GET = createGetHandler(adminBlogApi.getPosts, getBlogPostsResponseSchema);
export const POST = createPostHandler(adminBlogApi.createPost, createBlogPostRequestSchema);
