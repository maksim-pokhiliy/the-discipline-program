import { adminReviewsApi } from "@repo/api/server";
import { toggleReviewParamsSchema, toggleReviewQuerySchema } from "@repo/contracts/review";
import { handleApiError } from "@repo/errors";
import { NextResponse } from "next/server";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = toggleReviewParamsSchema.parse(await params);
    const url = new URL(request.url);

    const { field } = toggleReviewQuerySchema.parse({
      field: url.searchParams.get("field"),
    });

    if (field === "isActive") {
      return NextResponse.json(await adminReviewsApi.toggleReviewStatus(id));
    }

    return NextResponse.json(await adminReviewsApi.toggleReviewFeatured(id));
  } catch (error) {
    return handleApiError(error);
  }
}
