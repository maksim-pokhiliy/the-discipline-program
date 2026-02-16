import { adminProductsApi } from "@repo/api-server";
import { getProductsPageDataResponseSchema } from "@repo/contracts/product";

import { createGetHandler } from "@app/lib/route-helpers";

export const GET = createGetHandler(
  adminProductsApi.getPageData,
  getProductsPageDataResponseSchema,
);
