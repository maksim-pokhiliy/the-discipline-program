import { adminDashboardApi } from "@repo/api";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const stats = await adminDashboardApi.getStats();

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error);

    return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 });
  }
}
