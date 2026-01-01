import { programsApi } from "@repo/api/server";
import { handleApiError } from "@repo/errors";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const programs = await programsApi.getPrograms();

    return NextResponse.json(programs);
  } catch (error) {
    return handleApiError(error);
  }
}
