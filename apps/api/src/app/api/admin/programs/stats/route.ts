import { NextResponse } from "next/server";

import { adminProgramsApi } from "@repo/api-server";
import { getProgramStatsResponseSchema } from "@repo/contracts/program";
import { handleApiError } from "@repo/errors";

export async function GET() {
  try {
    const stats = await adminProgramsApi.getProgramsStats();
    const validated = getProgramStatsResponseSchema.parse(stats);

    return NextResponse.json(validated);
  } catch (error) {
    return handleApiError(error);
  }
}
