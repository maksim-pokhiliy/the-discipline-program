import { createGetHandler, createPostHandler } from "@repo/api-routes";
import { withAdminAuth } from "@repo/api-routes/auth";
import { adminProductsApi } from "@repo/api-server";
import { createProductRequestSchema, getProductsResponseSchema } from "@repo/contracts/product";

export const GET = withAdminAuth(
  createGetHandler(adminProductsApi.getAll, getProductsResponseSchema),
);
export const POST = withAdminAuth(
  createPostHandler(adminProductsApi.create, createProductRequestSchema),
);
