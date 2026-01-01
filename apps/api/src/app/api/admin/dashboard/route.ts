import { adminDashboardApi } from "@repo/api/server";
import { getDashboardDataResponseSchema } from "@repo/contracts/dashboard";
import { handleApiError } from "@repo/errors";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const data = await adminDashboardApi.getDashboardData();
    const validated = getDashboardDataResponseSchema.parse(data);

    return NextResponse.json(validated);
  } catch (error) {
    return handleApiError(error);
  }
}
