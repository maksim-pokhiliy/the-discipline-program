import { createGetHandler, createPostHandler } from "@repo/api-routes";
import { adminProductsApi } from "@repo/api-server";
import { createProductRequestSchema, getProductsResponseSchema } from "@repo/contracts/product";

import { withAdminAuth } from "@app/lib/server/auth";

export const GET = withAdminAuth(
  createGetHandler(adminProductsApi.getAll, getProductsResponseSchema),
);
export const POST = withAdminAuth(
  createPostHandler(adminProductsApi.create, createProductRequestSchema),
);
