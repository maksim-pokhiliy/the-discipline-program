import { NextResponse } from "next/server";

import { adminStorefrontApi } from "@repo/api-server";
import {
  createStorefrontProgramRequestSchema,
  getStorefrontProgramsResponseSchema,
} from "@repo/contracts/storefront";
import { handleApiError } from "@repo/errors";

export async function GET() {
  try {
    const programs = await adminStorefrontApi.getPrograms();
    const validated = getStorefrontProgramsResponseSchema.parse(programs);

    return NextResponse.json(validated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = createStorefrontProgramRequestSchema.parse(body);
    const program = await adminStorefrontApi.createProgram(data);

    return NextResponse.json(program);
  } catch (error) {
    return handleApiError(error);
  }
}
