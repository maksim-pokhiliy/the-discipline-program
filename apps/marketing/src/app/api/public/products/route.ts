import { NextResponse } from "next/server";

import { withPublicRoute } from "@repo/api-routes";
import { marketingProductsApi } from "@repo/api-server";
import { getProductsResponseSchema } from "@repo/contracts/product";

export const GET = withPublicRoute(async () => {
  const products = await marketingProductsApi.getAll();
  const validated = getProductsResponseSchema.parse(products);

  return NextResponse.json(validated);
});
