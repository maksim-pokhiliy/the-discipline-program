import { NextResponse } from "next/server";

import { adminProgramsApi } from "@repo/api-server";
import { createProgramRequestSchema, getProgramsResponseSchema } from "@repo/contracts/program";
import { handleApiError } from "@repo/errors";

export async function GET() {
  try {
    const programs = await adminProgramsApi.getPrograms();
    const validated = getProgramsResponseSchema.parse(programs);

    return NextResponse.json(validated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = createProgramRequestSchema.parse(body);
    const program = await adminProgramsApi.createProgram(data);

    return NextResponse.json(program);
  } catch (error) {
    return handleApiError(error);
  }
}
