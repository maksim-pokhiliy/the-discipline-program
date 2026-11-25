import {
  createDeleteHandler,
  createGetByIdHandler,
  createPutHandler,
  RATE_LIMIT_TIER,
  withAuthRateLimit,
} from "@repo/api-routes";
import {
  deleteProductParamsSchema,
  getProductByIdParamsSchema,
  adminProductSchema,
  updateProductParamsSchema,
  updateProductRequestSchema,
} from "@repo/contracts/cms/product";

import { withAdminAuth } from "@app/lib/server/auth";
import { cmsProductAdminApi } from "@app/lib/server/cms-product-admin-api";

export const GET = withAdminAuth(
  withAuthRateLimit(
    createGetByIdHandler(
      cmsProductAdminApi.getById,
      getProductByIdParamsSchema,
      adminProductSchema,
    ),
    RATE_LIMIT_TIER.API,
  ),
);

export const PUT = withAdminAuth(
  withAuthRateLimit(
    createPutHandler(
      cmsProductAdminApi.update,
      updateProductParamsSchema,
      updateProductRequestSchema,
      adminProductSchema,
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
