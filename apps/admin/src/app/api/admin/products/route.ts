import {
  createGetHandler,
  createPostHandler,
  RATE_LIMIT_TIER,
  withAuthRateLimit,
} from "@repo/api-routes";
import { cmsProductAdminApi } from "@repo/api-server/cms";
import {
  createProductRequestSchema,
  getProductsResponseSchema,
  productSchema,
} from "@repo/contracts/cms/product";

import { withAdminAuth } from "@app/lib/server/auth";

export const GET = withAdminAuth(
  withAuthRateLimit(
    createGetHandler(cmsProductAdminApi.getAll, getProductsResponseSchema),
    RATE_LIMIT_TIER.API,
  ),
);
export const POST = withAdminAuth(
  withAuthRateLimit(
    createPostHandler(cmsProductAdminApi.create, createProductRequestSchema, productSchema),
    RATE_LIMIT_TIER.API,
  ),
);
