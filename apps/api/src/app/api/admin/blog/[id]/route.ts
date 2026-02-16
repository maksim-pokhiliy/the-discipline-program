import { adminBlogApi } from "@repo/api-server";
import {
  deleteBlogPostParamsSchema,
  getBlogPostByIdParamsSchema,
  updateBlogPostParamsSchema,
  updateBlogPostRequestSchema,
} from "@repo/contracts/blog";

import {
  createDeleteHandler,
  createGetByIdHandler,
  createPutHandler,
} from "@app/lib/route-helpers";

export const GET = createGetByIdHandler(adminBlogApi.getPostById, getBlogPostByIdParamsSchema);
export const PUT = createPutHandler(
  adminBlogApi.updatePost,
  updateBlogPostParamsSchema,
  updateBlogPostRequestSchema,
);
export const DELETE = createDeleteHandler(adminBlogApi.deletePost, deleteBlogPostParamsSchema);
