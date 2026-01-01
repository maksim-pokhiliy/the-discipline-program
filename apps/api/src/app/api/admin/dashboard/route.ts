import { adminDashboardApi } from "@repo/api/server";
import { handleApiError } from "@repo/errors";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const data = await adminDashboardApi.getDashboardData();

    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}
