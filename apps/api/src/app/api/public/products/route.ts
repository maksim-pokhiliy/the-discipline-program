import { NextResponse } from "next/server";

import { marketingProductsApi } from "@repo/api-server";
import { getProductsResponseSchema } from "@repo/contracts/product";
import { handleApiError } from "@repo/errors";

export async function GET() {
  try {
    const products = await marketingProductsApi.getAll();
    const validated = getProductsResponseSchema.parse(products);

    return NextResponse.json(validated);
  } catch (error) {
    return handleApiError(error);
  }
}
