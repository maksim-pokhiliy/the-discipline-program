import { NextResponse } from "next/server";

import { adminReviewsApi } from "@repo/api-server";
import { getReviewsPageDataResponseSchema } from "@repo/contracts/review";
import { handleApiError } from "@repo/errors";

export async function GET() {
  try {
    const pageData = await adminReviewsApi.getReviewsPageData();
    const validated = getReviewsPageDataResponseSchema.parse(pageData);

    return NextResponse.json(validated);
  } catch (error) {
    return handleApiError(error);
  }
}
