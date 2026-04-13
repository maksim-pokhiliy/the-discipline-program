import { createDeleteHandler, createGetByIdHandler, createPutHandler } from "@repo/api-routes";
import { cmsProductAdminApi } from "@repo/api-server/cms";
import {
  deleteProductParamsSchema,
  getProductByIdParamsSchema,
  productSchema,
  updateProductParamsSchema,
  updateProductRequestSchema,
} from "@repo/contracts/cms/product";

import { withAdminAuth } from "@app/lib/server/auth";

export const GET = withAdminAuth(
  createGetByIdHandler(cmsProductAdminApi.getById, getProductByIdParamsSchema, productSchema),
);
export const PUT = withAdminAuth(
  createPutHandler(
    cmsProductAdminApi.update,
    updateProductParamsSchema,
    updateProductRequestSchema,
    productSchema,
  ),
);
export const DELETE = withAdminAuth(
  createDeleteHandler(cmsProductAdminApi.delete, deleteProductParamsSchema),
);
