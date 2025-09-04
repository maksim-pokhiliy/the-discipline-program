import { adminReviewsApi } from "@repo/api";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const stats = await adminReviewsApi.getReviewsStats();

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Failed to fetch reviews stats:", error);

    return NextResponse.json({ error: "Failed to fetch reviews stats" }, { status: 500 });
  }
}
