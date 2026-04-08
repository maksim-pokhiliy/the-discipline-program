import { NextResponse } from "next/server";

import { platformWorkoutsApi } from "@repo/api-server";
import {
  createWorkoutParamsSchema,
  createWorkoutRequestSchema,
  createWorkoutResponseSchema,
  getWorkoutsParamsSchema,
  getWorkoutsResponseSchema,
} from "@repo/contracts/workout";

import { withPlatformAuth } from "@app/lib/server/auth";

export const GET = withPlatformAuth(async (_, context, userId) => {
  const { planId } = getWorkoutsParamsSchema.parse(await context.params);
  const data = await platformWorkoutsApi.getAll(userId, planId);
  const validated = getWorkoutsResponseSchema.parse(data);

  return NextResponse.json(validated);
});

export const POST = withPlatformAuth(async (request, context, userId) => {
  const { planId } = createWorkoutParamsSchema.parse(await context.params);
  const body = await request.json();
  const data = createWorkoutRequestSchema.parse(body);
  const result = await platformWorkoutsApi.create(userId, planId, data);
  const validated = createWorkoutResponseSchema.parse(result);

  return NextResponse.json(validated, { status: 201 });
});
