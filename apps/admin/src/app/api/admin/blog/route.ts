import {
  createGetHandler,
  createPostHandler,
  RATE_LIMIT_TIER,
  withAuthRateLimit,
} from "@repo/api-routes";
import { cmsBlogAdminApi } from "@repo/api-server/cms";
import {
  blogPostSchema,
  createBlogPostRequestSchema,
  getBlogPostsResponseSchema,
} from "@repo/contracts/cms/blog";

import { withAdminAuth } from "@app/lib/server/auth";

export const GET = withAdminAuth(
  withAuthRateLimit(
    createGetHandler(cmsBlogAdminApi.getPosts, getBlogPostsResponseSchema),
    RATE_LIMIT_TIER.API,
  ),
);
export const POST = withAdminAuth(
  withAuthRateLimit(
    createPostHandler(cmsBlogAdminApi.createPost, createBlogPostRequestSchema, blogPostSchema),
    RATE_LIMIT_TIER.API,
  ),
);
