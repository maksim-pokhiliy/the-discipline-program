import {
  createDeleteHandler,
  createGetByIdHandler,
  createPutHandler,
  RATE_LIMIT_TIER,
  withAuthRateLimit,
} from "@repo/api-routes";
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
  withAuthRateLimit(
    createGetByIdHandler(cmsProductAdminApi.getById, getProductByIdParamsSchema, productSchema),
    RATE_LIMIT_TIER.API,
  ),
);

export const PUT = withAdminAuth(
  withAuthRateLimit(
    createPutHandler(
      cmsProductAdminApi.update,
      updateProductParamsSchema,
      updateProductRequestSchema,
      productSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const DELETE = withAdminAuth(
  withAuthRateLimit(
    createDeleteHandler(cmsProductAdminApi.delete, deleteProductParamsSchema),
    RATE_LIMIT_TIER.API,
  ),
);
