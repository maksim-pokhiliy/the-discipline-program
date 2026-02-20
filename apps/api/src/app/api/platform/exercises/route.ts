import { NextResponse } from "next/server";

import { adminExercisesApi } from "@repo/api-server";
import { createExerciseRequestSchema, getExercisesResponseSchema } from "@repo/contracts/exercise";
import { handleApiError } from "@repo/errors";

import { getAuthenticatedUserId } from "@app/lib/auth";

export const GET = async () => {
  try {
    await getAuthenticatedUserId();
    const data = await adminExercisesApi.getAll();
    const validated = getExercisesResponseSchema.parse(data);

    return NextResponse.json(validated);
  } catch (error) {
    return handleApiError(error);
  }
};

export const POST = async (request: Request) => {
  try {
    await getAuthenticatedUserId();
    const body = await request.json();
    const data = createExerciseRequestSchema.parse(body);
    const result = await adminExercisesApi.create(data);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
};
