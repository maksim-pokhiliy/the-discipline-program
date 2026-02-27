import { createDeleteHandler, createGetByIdHandler, createPutHandler } from "@repo/api-routes";
import { withAdminAuth } from "@repo/api-routes/auth";
import { adminBlogApi } from "@repo/api-server";
import {
  deleteBlogPostParamsSchema,
  getBlogPostByIdParamsSchema,
  updateBlogPostParamsSchema,
  updateBlogPostRequestSchema,
} from "@repo/contracts/blog";

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
