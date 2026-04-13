import { createDeleteHandler, createGetByIdHandler, createPutHandler } from "@repo/api-routes";
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
  createGetByIdHandler(cmsBlogAdminApi.getPostById, getBlogPostByIdParamsSchema, blogPostSchema),
);
export const PUT = withAdminAuth(
  createPutHandler(
    cmsBlogAdminApi.updatePost,
    updateBlogPostParamsSchema,
    updateBlogPostRequestSchema,
    blogPostSchema,
  ),
);
export const DELETE = withAdminAuth(
  createDeleteHandler(cmsBlogAdminApi.deletePost, deleteBlogPostParamsSchema),
);
