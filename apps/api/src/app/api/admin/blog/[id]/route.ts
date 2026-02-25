import { adminBlogApi } from "@repo/api-server";
import {
  deleteBlogPostParamsSchema,
  getBlogPostByIdParamsSchema,
  updateBlogPostParamsSchema,
  updateBlogPostRequestSchema,
} from "@repo/contracts/blog";

import { withAdminAuth } from "@app/lib/auth";
import {
  createDeleteHandler,
  createGetByIdHandler,
  createPutHandler,
} from "@app/lib/route-helpers";

export const GET = withAdminAuth(
  createGetByIdHandler(adminBlogApi.getPostById, getBlogPostByIdParamsSchema),
);
export const PUT = withAdminAuth(
  createPutHandler(
    adminBlogApi.updatePost,
    updateBlogPostParamsSchema,
    updateBlogPostRequestSchema,
  ),
);
export const DELETE = withAdminAuth(
  createDeleteHandler(adminBlogApi.deletePost, deleteBlogPostParamsSchema),
);
