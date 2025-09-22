import { adminBlogApi } from "@repo/api";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const stats = await adminBlogApi.getBlogStats();

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Failed to fetch blog stats:", error);

    return NextResponse.json({ error: "Failed to fetch blog stats" }, { status: 500 });
  }
}
