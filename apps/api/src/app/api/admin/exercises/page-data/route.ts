import { NextResponse } from "next/server";

import { adminExercisesApi } from "@repo/api-server";
import { getExercisesPageDataResponseSchema } from "@repo/contracts/exercise";
import { handleApiError } from "@repo/errors";

export async function GET() {
  try {
    const pageData = await adminExercisesApi.getPageData();
    const validated = getExercisesPageDataResponseSchema.parse(pageData);

    return NextResponse.json(validated);
  } catch (error) {
    return handleApiError(error);
  }
}
