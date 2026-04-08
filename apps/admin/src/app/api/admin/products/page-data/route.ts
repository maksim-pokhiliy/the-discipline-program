import { createGetHandler } from "@repo/api-routes";
import { adminProductsApi } from "@repo/api-server";
import { getProductsPageDataResponseSchema } from "@repo/contracts/product";

import { withAdminAuth } from "@app/lib/server/auth";

export const GET = withAdminAuth(
  createGetHandler(adminProductsApi.getPageData, getProductsPageDataResponseSchema),
);
