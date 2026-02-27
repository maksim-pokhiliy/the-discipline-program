import { NextResponse } from "next/server";

import { handleApiError } from "@repo/api-routes";
import { marketingProductsApi } from "@repo/api-server";
import { getProductsResponseSchema } from "@repo/contracts/product";

export async function GET() {
  try {
    const products = await marketingProductsApi.getAll();
    const validated = getProductsResponseSchema.parse(products);

    return NextResponse.json(validated);
  } catch (error) {
    return handleApiError(error);
  }
}
