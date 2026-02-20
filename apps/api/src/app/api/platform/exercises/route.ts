import { NextResponse } from "next/server";

import { adminExercisesApi } from "@repo/api-server";
import { createExerciseRequestSchema, getExercisesResponseSchema } from "@repo/contracts/exercise";

import { withPlatformAuth } from "@app/lib/auth";

export const GET = withPlatformAuth(async () => {
  const data = await adminExercisesApi.getAll();
  const validated = getExercisesResponseSchema.parse(data);

  return NextResponse.json(validated);
});

export const POST = withPlatformAuth(async (request) => {
  const body = await request.json();
  const data = createExerciseRequestSchema.parse(body);
  const result = await adminExercisesApi.create(data);

  return NextResponse.json(result, { status: 201 });
});
