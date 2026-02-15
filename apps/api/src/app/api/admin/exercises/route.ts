import { NextResponse } from "next/server";

import { adminExercisesApi } from "@repo/api-server";
import { createExerciseRequestSchema, getExercisesResponseSchema } from "@repo/contracts/exercise";
import { handleApiError } from "@repo/errors";

export async function GET() {
  try {
    const exercises = await adminExercisesApi.getAll();
    const validated = getExercisesResponseSchema.parse(exercises);

    return NextResponse.json(validated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = createExerciseRequestSchema.parse(body);
    const exercise = await adminExercisesApi.create(data);

    return NextResponse.json(exercise);
  } catch (error) {
    return handleApiError(error);
  }
}
