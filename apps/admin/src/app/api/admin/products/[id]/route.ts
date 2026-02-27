import { createDeleteHandler, createGetByIdHandler, createPutHandler } from "@repo/api-routes";
import { withAdminAuth } from "@repo/api-routes/auth";
import { adminProductsApi } from "@repo/api-server";
import {
  deleteProductParamsSchema,
  getProductByIdParamsSchema,
  updateProductParamsSchema,
  updateProductRequestSchema,
} from "@repo/contracts/product";

export const GET = withAdminAuth(
  createGetByIdHandler(adminProductsApi.getById, getProductByIdParamsSchema),
);
export const PUT = withAdminAuth(
  createPutHandler(adminProductsApi.update, updateProductParamsSchema, updateProductRequestSchema),
);
export const DELETE = withAdminAuth(
  createDeleteHandler(adminProductsApi.delete, deleteProductParamsSchema),
);
