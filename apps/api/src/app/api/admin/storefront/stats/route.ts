import { NextResponse } from "next/server";

import { adminStorefrontApi } from "@repo/api-server";
import { getStorefrontProgramStatsResponseSchema } from "@repo/contracts/storefront";
import { handleApiError } from "@repo/errors";

export async function GET() {
  try {
    const stats = await adminStorefrontApi.getProgramsStats();
    const validated = getStorefrontProgramStatsResponseSchema.parse(stats);

    return NextResponse.json(validated);
  } catch (error) {
    return handleApiError(error);
  }
}
