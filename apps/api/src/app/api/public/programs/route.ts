import { programsApi } from "@repo/api/server";
import { getProgramsResponseSchema } from "@repo/contracts/program";
import { handleApiError } from "@repo/errors";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const programs = await programsApi.getPrograms();
    const validated = getProgramsResponseSchema.parse(programs);

    return NextResponse.json(validated);
  } catch (error) {
    return handleApiError(error);
  }
}
