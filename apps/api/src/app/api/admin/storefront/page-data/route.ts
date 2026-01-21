import { NextResponse } from "next/server";

import { adminStorefrontApi } from "@repo/api-server";
import { getStorefrontProgramsPageDataResponseSchema } from "@repo/contracts/storefront";
import { handleApiError } from "@repo/errors";

export async function GET() {
  try {
    const pageData = await adminStorefrontApi.getProgramsPageData();
    const validated = getStorefrontProgramsPageDataResponseSchema.parse(pageData);

    return NextResponse.json(validated);
  } catch (error) {
    return handleApiError(error);
  }
}
