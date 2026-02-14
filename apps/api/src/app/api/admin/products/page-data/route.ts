import { NextResponse } from "next/server";

import { adminProductsApi } from "@repo/api-server";
import { getProductsPageDataResponseSchema } from "@repo/contracts/product";
import { handleApiError } from "@repo/errors";

export async function GET() {
  try {
    const pageData = await adminProductsApi.getPageData();
    const validated = getProductsPageDataResponseSchema.parse(pageData);

    return NextResponse.json(validated);
  } catch (error) {
    return handleApiError(error);
  }
}
