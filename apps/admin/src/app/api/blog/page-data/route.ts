import { adminBlogApi } from "@repo/api";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const pageData = await adminBlogApi.getBlogPageData();

    return NextResponse.json(pageData);
  } catch (error) {
    console.error("Failed to fetch reviews page data:", error);

    return NextResponse.json({ error: "Failed to fetch reviews page data" }, { status: 500 });
  }
}
