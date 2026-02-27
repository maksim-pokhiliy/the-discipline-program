import { createGetHandler } from "@repo/api-routes";
import { withAdminAuth } from "@repo/api-routes/auth";
import { adminProductsApi } from "@repo/api-server";
import { getProductsPageDataResponseSchema } from "@repo/contracts/product";

export const GET = withAdminAuth(
  createGetHandler(adminProductsApi.getPageData, getProductsPageDataResponseSchema),
);
