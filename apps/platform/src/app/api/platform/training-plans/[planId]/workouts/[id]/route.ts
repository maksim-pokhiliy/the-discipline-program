import { NextResponse } from "next/server";

import { platformWorkoutsApi } from "@repo/api-server";
import {
  deleteWorkoutParamsSchema,
  getWorkoutByIdParamsSchema,
  getWorkoutResponseSchema,
  updateWorkoutParamsSchema,
  updateWorkoutRequestSchema,
  updateWorkoutResponseSchema,
} from "@repo/contracts/workout";

import { withPlatformAuth } from "@app/lib/server/auth";

export const GET = withPlatformAuth(async (_, context, userId) => {
  const { planId, id } = getWorkoutByIdParamsSchema.parse(await context.params);
  const data = await platformWorkoutsApi.getById(userId, planId, id);
  const validated = getWorkoutResponseSchema.parse(data);

  return NextResponse.json(validated);
});

export const PUT = withPlatformAuth(async (request, context, userId) => {
  const { planId, id } = updateWorkoutParamsSchema.parse(await context.params);
  const body = await request.json();
  const data = updateWorkoutRequestSchema.parse(body);
  const result = await platformWorkoutsApi.update(userId, planId, id, data);
  const validated = updateWorkoutResponseSchema.parse(result);

  return NextResponse.json(validated);
});

export const DELETE = withPlatformAuth(async (_, context, userId) => {
  const { planId, id } = deleteWorkoutParamsSchema.parse(await context.params);

  await platformWorkoutsApi.delete(userId, planId, id);

  return NextResponse.json({ success: true });
});
