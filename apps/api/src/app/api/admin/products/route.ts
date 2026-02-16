import { adminProductsApi } from "@repo/api-server";
import { createProductRequestSchema, getProductsResponseSchema } from "@repo/contracts/product";

import { createGetHandler, createPostHandler } from "@app/lib/route-helpers";

export const GET = createGetHandler(adminProductsApi.getAll, getProductsResponseSchema);
export const POST = createPostHandler(adminProductsApi.create, createProductRequestSchema);
