import { NextResponse } from "next/server";

import { adminReviewsApi } from "@repo/api-server";
import { updateReviewsOrderRequestSchema } from "@repo/contracts/review";
import { handleApiError } from "@repo/errors";

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const updates = updateReviewsOrderRequestSchema.parse(body);

    await adminReviewsApi.updateReviewsOrder(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
