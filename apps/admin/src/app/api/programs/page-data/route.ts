import { adminProgramsApi } from "@repo/api";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const pageData = await adminProgramsApi.getProgramsPageData();

    return NextResponse.json(pageData);
  } catch (error) {
    console.error("Failed to fetch programs page data:", error);

    return NextResponse.json({ error: "Failed to fetch programs page data" }, { status: 500 });
  }
}
