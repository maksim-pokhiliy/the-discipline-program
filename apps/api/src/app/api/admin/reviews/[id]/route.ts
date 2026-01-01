import { adminReviewsApi } from "@repo/api/server";
import {
  getReviewByIdParamsSchema,
  updateReviewRequestSchema,
  deleteReviewParamsSchema,
} from "@repo/contracts/review";
import { handleApiError } from "@repo/errors";
import { NextResponse } from "next/server";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = getReviewByIdParamsSchema.parse(await params);
    const review = await adminReviewsApi.getReviewById(id);

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    return NextResponse.json(review);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = updateReviewRequestSchema.parse(body);
    const review = await adminReviewsApi.updateReview(id, data);

    return NextResponse.json(review);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = deleteReviewParamsSchema.parse(await params);

    await adminReviewsApi.deleteReview(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
