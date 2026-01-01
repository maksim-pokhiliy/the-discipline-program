import { adminReviewsApi } from "@repo/api/server";
import { handleApiError } from "@repo/errors";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const pageData = await adminReviewsApi.getReviewsPageData();

    return NextResponse.json(pageData);
  } catch (error) {
    return handleApiError(error);
  }
}
