import { adminProgramsApi } from "@repo/api/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const stats = await adminProgramsApi.getProgramsStats();

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Failed to fetch programs stats:", error);

    return NextResponse.json({ error: "Failed to fetch programs stats" }, { status: 500 });
  }
}
