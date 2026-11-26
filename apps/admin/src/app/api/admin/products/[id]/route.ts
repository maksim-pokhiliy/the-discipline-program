import { NextResponse } from "next/server";

import {
  createDeleteHandler,
  createPutHandler,
  parseQuery,
  parseRequest,
  parseResponse,
  RATE_LIMIT_TIER,
  type RouteContext,
  withAuthRateLimit,
} from "@repo/api-routes";
import {
  deleteProductParamsSchema,
  getProductByIdParamsSchema,
  getProductQuerySchema,
  getProductResponseSchema,
  adminProductSchema,
  updateProductParamsSchema,
  updateProductRequestSchema,
} from "@repo/contracts/cms/product";

import { withAdminAuth } from "@app/lib/server/auth";
import { cmsProductAdminApi } from "@app/lib/server/cms-product-admin-api";

const getProductDetails = async (request: Request, context: RouteContext): Promise<Response> => {
  const { id } = parseRequest(getProductByIdParamsSchema, await context.params);
  const { locale } = parseQuery(getProductQuerySchema, request);
  const details = await cmsProductAdminApi.getById(id, locale);

  return NextResponse.json(parseResponse(getProductResponseSchema, details));
};

export const GET = withAdminAuth(withAuthRateLimit(getProductDetails, RATE_LIMIT_TIER.API));

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
