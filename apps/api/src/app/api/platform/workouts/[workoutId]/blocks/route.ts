import { NextResponse } from "next/server";

import { platformWorkoutBlocksApi } from "@repo/api-server";
import {
  createWorkoutBlockParamsSchema,
  createWorkoutBlockRequestSchema,
  createWorkoutBlockResponseSchema,
  getWorkoutBlocksParamsSchema,
  getWorkoutBlocksResponseSchema,
} from "@repo/contracts/workout-block";

import { withPlatformAuth } from "@app/lib/auth";

export const GET = withPlatformAuth(async (_, context, userId) => {
  const { workoutId } = getWorkoutBlocksParamsSchema.parse(await context.params);
  const data = await platformWorkoutBlocksApi.getAll(userId, workoutId);
  const validated = getWorkoutBlocksResponseSchema.parse(data);

  return NextResponse.json(validated);
});

export const POST = withPlatformAuth(async (request, context, userId) => {
  const { workoutId } = createWorkoutBlockParamsSchema.parse(await context.params);
  const body = await request.json();
  const data = createWorkoutBlockRequestSchema.parse(body);
  const result = await platformWorkoutBlocksApi.create(userId, workoutId, data);
  const validated = createWorkoutBlockResponseSchema.parse(result);

  return NextResponse.json(validated, { status: 201 });
});
