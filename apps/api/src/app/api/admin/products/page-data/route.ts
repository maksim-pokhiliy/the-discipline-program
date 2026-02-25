import { adminProductsApi } from "@repo/api-server";
import { getProductsPageDataResponseSchema } from "@repo/contracts/product";

import { withAdminAuth } from "@app/lib/auth";
import { createGetHandler } from "@app/lib/route-helpers";

export const GET = withAdminAuth(
  createGetHandler(adminProductsApi.getPageData, getProductsPageDataResponseSchema),
);
