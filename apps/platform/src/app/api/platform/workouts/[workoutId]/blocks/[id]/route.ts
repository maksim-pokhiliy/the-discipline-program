import { NextResponse } from "next/server";

import { withPlatformAuth } from "@repo/api-routes/auth";
import { platformWorkoutBlocksApi } from "@repo/api-server";
import {
  deleteWorkoutBlockParamsSchema,
  getWorkoutBlockByIdParamsSchema,
  getWorkoutBlockResponseSchema,
  updateWorkoutBlockParamsSchema,
  updateWorkoutBlockRequestSchema,
  updateWorkoutBlockResponseSchema,
} from "@repo/contracts/workout-block";

export const GET = withPlatformAuth(async (_, context, userId) => {
  const { workoutId, id } = getWorkoutBlockByIdParamsSchema.parse(await context.params);
  const data = await platformWorkoutBlocksApi.getById(userId, workoutId, id);
  const validated = getWorkoutBlockResponseSchema.parse(data);

  return NextResponse.json(validated);
});

export const PUT = withPlatformAuth(async (request, context, userId) => {
  const { workoutId, id } = updateWorkoutBlockParamsSchema.parse(await context.params);
  const body = await request.json();
  const data = updateWorkoutBlockRequestSchema.parse(body);
  const result = await platformWorkoutBlocksApi.update(userId, workoutId, id, data);
  const validated = updateWorkoutBlockResponseSchema.parse(result);

  return NextResponse.json(validated);
});

export const DELETE = withPlatformAuth(async (_, context, userId) => {
  const { workoutId, id } = deleteWorkoutBlockParamsSchema.parse(await context.params);

  await platformWorkoutBlocksApi.delete(userId, workoutId, id);

  return NextResponse.json({ success: true });
});
