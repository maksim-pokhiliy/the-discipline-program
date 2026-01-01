import { adminProgramsApi } from "@repo/api/server";
import { handleApiError } from "@repo/errors";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const stats = await adminProgramsApi.getProgramsStats();

    return NextResponse.json(stats);
  } catch (error) {
    return handleApiError(error);
  }
}
