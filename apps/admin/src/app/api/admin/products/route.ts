import {
  createGetHandler,
  createPostHandler,
  RATE_LIMIT_TIER,
  withAuthRateLimit,
} from "@repo/api-routes";
import {
  createProductRequestSchema,
  getProductsResponseSchema,
  adminProductSchema,
} from "@repo/contracts/cms/product";

import { withAdminAuth } from "@app/lib/server/auth";
import { cmsProductAdminApi } from "@app/lib/server/cms-product-admin-api";

export const GET = withAdminAuth(
  withAuthRateLimit(
    createGetHandler(cmsProductAdminApi.getAll, getProductsResponseSchema),
    RATE_LIMIT_TIER.API,
  ),
);

export const POST = withAdminAuth(
  withAuthRateLimit(
    createPostHandler(cmsProductAdminApi.create, createProductRequestSchema, adminProductSchema),
    RATE_LIMIT_TIER.API,
  ),
);
