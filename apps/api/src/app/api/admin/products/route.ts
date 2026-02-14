import { NextResponse } from "next/server";

import { adminProductsApi } from "@repo/api-server";
import { createProductRequestSchema, getProductsResponseSchema } from "@repo/contracts/product";
import { handleApiError } from "@repo/errors";

export async function GET() {
  try {
    const products = await adminProductsApi.getAll();
    const validated = getProductsResponseSchema.parse(products);

    return NextResponse.json(validated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = createProductRequestSchema.parse(body);
    const product = await adminProductsApi.create(data);

    return NextResponse.json(product);
  } catch (error) {
    return handleApiError(error);
  }
}
