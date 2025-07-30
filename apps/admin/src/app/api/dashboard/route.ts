import { adminDashboardApi } from "@repo/api";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const dashboardData = await adminDashboardApi.getDashboardData();

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error("Failed to fetch dashboard data:", error);

    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
