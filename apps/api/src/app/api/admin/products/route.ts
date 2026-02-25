import { adminProductsApi } from "@repo/api-server";
import { createProductRequestSchema, getProductsResponseSchema } from "@repo/contracts/product";

import { withAdminAuth } from "@app/lib/auth";
import { createGetHandler, createPostHandler } from "@app/lib/route-helpers";

export const GET = withAdminAuth(
  createGetHandler(adminProductsApi.getAll, getProductsResponseSchema),
);
export const POST = withAdminAuth(
  createPostHandler(adminProductsApi.create, createProductRequestSchema),
);
