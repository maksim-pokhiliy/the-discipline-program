import { NextResponse } from "next/server";

import { platformWorkoutBlocksApi } from "@repo/api-server";
import {
  createWorkoutBlockParamsSchema,
  createWorkoutBlockRequestSchema,
  createWorkoutBlockResponseSchema,
  getWorkoutBlocksParamsSchema,
  getWorkoutBlocksResponseSchema,
} from "@repo/contracts/workout-block";

import { getAuthenticatedUserId } from "@app/lib/auth";
import { handleApiError } from "@app/lib/error-handler";

type RouteContext = { params: Promise<{ workoutId: string }> };

export const GET = async (_: Request, context: RouteContext) => {
  try {
    const userId = await getAuthenticatedUserId();
    const { workoutId } = getWorkoutBlocksParamsSchema.parse(await context.params);
    const data = await platformWorkoutBlocksApi.getAll(userId, workoutId);
    const validated = getWorkoutBlocksResponseSchema.parse(data);

    return NextResponse.json(validated);
  } catch (error) {
    return handleApiError(error);
  }
};

export const POST = async (request: Request, context: RouteContext) => {
  try {
    const userId = await getAuthenticatedUserId();
    const { workoutId } = createWorkoutBlockParamsSchema.parse(await context.params);
    const body = await request.json();
    const data = createWorkoutBlockRequestSchema.parse(body);
    const result = await platformWorkoutBlocksApi.create(userId, workoutId, data);
    const validated = createWorkoutBlockResponseSchema.parse(result);

    return NextResponse.json(validated, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
};
