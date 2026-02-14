import { NextResponse } from "next/server";

import { adminProductsApi } from "@repo/api-server";
import { getProductStatsResponseSchema } from "@repo/contracts/product";
import { handleApiError } from "@repo/errors";

export async function GET() {
  try {
    const stats = await adminProductsApi.getStats();
    const validated = getProductStatsResponseSchema.parse(stats);

    return NextResponse.json(validated);
  } catch (error) {
    return handleApiError(error);
  }
}
