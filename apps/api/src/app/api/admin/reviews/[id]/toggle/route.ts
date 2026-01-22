import { NextResponse } from "next/server";

import { adminReviewsApi } from "@repo/api-server";
import { toggleReviewParamsSchema } from "@repo/contracts/review";
import { handleApiError } from "@repo/errors";

export async function PATCH(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = toggleReviewParamsSchema.parse(await params);

    return NextResponse.json(await adminReviewsApi.toggleReviewStatus(id));
  } catch (error) {
    return handleApiError(error);
  }
}
