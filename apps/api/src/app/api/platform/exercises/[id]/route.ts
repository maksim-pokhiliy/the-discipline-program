import { NextResponse } from "next/server";

import { adminExercisesApi } from "@repo/api-server";
import {
  getExerciseByIdParamsSchema,
  getExerciseResponseSchema,
  updateExerciseParamsSchema,
  updateExerciseRequestSchema,
} from "@repo/contracts/exercise";

import { withPlatformAuth } from "@app/lib/auth";

export const GET = withPlatformAuth(async (_, context) => {
  const { id } = getExerciseByIdParamsSchema.parse(await context.params);
  const data = await adminExercisesApi.getById(id);
  const validated = getExerciseResponseSchema.parse(data);

  return NextResponse.json(validated);
});

export const PUT = withPlatformAuth(async (request, context) => {
  const { id } = updateExerciseParamsSchema.parse(await context.params);
  const body = await request.json();
  const data = updateExerciseRequestSchema.parse(body);
  const result = await adminExercisesApi.update(id, data);

  return NextResponse.json(result);
});
