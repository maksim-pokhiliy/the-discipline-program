import {
  createDeleteHandler,
  createGetByIdHandler,
  createPutHandler,
  RATE_LIMIT_TIER,
  withAuthRateLimit,
} from "@repo/api-routes";
import { cmsBlogAdminApi } from "@repo/api-server/cms";
import {
  blogPostSchema,
  deleteBlogPostParamsSchema,
  getBlogPostByIdParamsSchema,
  updateBlogPostParamsSchema,
  updateBlogPostRequestSchema,
} from "@repo/contracts/cms/blog";

import { withAdminAuth } from "@app/lib/server/auth";

export const GET = withAdminAuth(
  withAuthRateLimit(
    createGetByIdHandler(cmsBlogAdminApi.getPostById, getBlogPostByIdParamsSchema, blogPostSchema),
    RATE_LIMIT_TIER.API,
  ),
);

export const PUT = withAdminAuth(
  withAuthRateLimit(
    createPutHandler(
      cmsBlogAdminApi.updatePost,
      updateBlogPostParamsSchema,
      updateBlogPostRequestSchema,
      blogPostSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const DELETE = withAdminAuth(
  withAuthRateLimit(
    createDeleteHandler(cmsBlogAdminApi.deletePost, deleteBlogPostParamsSchema),
    RATE_LIMIT_TIER.API,
  ),
);
