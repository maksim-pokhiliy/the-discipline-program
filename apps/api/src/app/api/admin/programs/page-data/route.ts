import { NextResponse } from "next/server";

import { adminProgramsApi } from "@repo/api-server";
import { getProgramsPageDataResponseSchema } from "@repo/contracts/program";
import { handleApiError } from "@repo/errors";

export async function GET() {
  try {
    const pageData = await adminProgramsApi.getProgramsPageData();
    const validated = getProgramsPageDataResponseSchema.parse(pageData);

    return NextResponse.json(validated);
  } catch (error) {
    return handleApiError(error);
  }
}
