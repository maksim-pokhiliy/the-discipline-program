import { adminProductsApi } from "@repo/api-server";
import {
  deleteProductParamsSchema,
  getProductByIdParamsSchema,
  updateProductParamsSchema,
  updateProductRequestSchema,
} from "@repo/contracts/product";

import {
  createDeleteHandler,
  createGetByIdHandler,
  createPutHandler,
} from "@app/lib/route-helpers";

export const GET = createGetByIdHandler(adminProductsApi.getById, getProductByIdParamsSchema);
export const PUT = createPutHandler(
  adminProductsApi.update,
  updateProductParamsSchema,
  updateProductRequestSchema,
);
export const DELETE = createDeleteHandler(adminProductsApi.delete, deleteProductParamsSchema);
