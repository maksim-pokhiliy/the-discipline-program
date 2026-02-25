import { adminProductsApi } from "@repo/api-server";
import {
  deleteProductParamsSchema,
  getProductByIdParamsSchema,
  updateProductParamsSchema,
  updateProductRequestSchema,
} from "@repo/contracts/product";

import { withAdminAuth } from "@app/lib/auth";
import {
  createDeleteHandler,
  createGetByIdHandler,
  createPutHandler,
} from "@app/lib/route-helpers";

export const GET = withAdminAuth(
  createGetByIdHandler(adminProductsApi.getById, getProductByIdParamsSchema),
);
export const PUT = withAdminAuth(
  createPutHandler(adminProductsApi.update, updateProductParamsSchema, updateProductRequestSchema),
);
export const DELETE = withAdminAuth(
  createDeleteHandler(adminProductsApi.delete, deleteProductParamsSchema),
);
