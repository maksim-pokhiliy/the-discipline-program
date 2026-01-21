import { NextResponse } from "next/server";

import { marketingStorefrontApi } from "@repo/api-server";
import { getStorefrontProgramsResponseSchema } from "@repo/contracts/storefront";
import { handleApiError } from "@repo/errors";

export async function GET() {
  try {
    const programs = await marketingStorefrontApi.getPrograms();
    const validated = getStorefrontProgramsResponseSchema.parse(programs);

    return NextResponse.json(validated);
  } catch (error) {
    return handleApiError(error);
  }
}
