import { adminReviewsApi } from "@repo/api/server";
import { NextResponse } from "next/server";

const allowedFields = ["isActive", "isFeatured"] as const;

type ToggleField = (typeof allowedFields)[number];

function isToggleField(value: string | null): value is ToggleField {
  return allowedFields.includes(value as ToggleField);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const url = new URL(request.url);
    const field = url.searchParams.get("field");

    if (!isToggleField(field)) {
      return NextResponse.json({ error: "Invalid field" }, { status: 400 });
    }

    if (field === "isActive") {
      return NextResponse.json(await adminReviewsApi.toggleReviewStatus(id));
    }

    return NextResponse.json(await adminReviewsApi.toggleReviewFeatured(id));
  } catch (error) {
    console.error("Failed to toggle program status:", error);

    const message = error instanceof Error ? error.message : "Failed to toggle program status";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
