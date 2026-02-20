import { NextResponse } from "next/server";

import { platformWorkoutBlocksApi } from "@repo/api-server";
import {
  deleteWorkoutBlockParamsSchema,
  getWorkoutBlockByIdParamsSchema,
  getWorkoutBlockResponseSchema,
  updateWorkoutBlockParamsSchema,
  updateWorkoutBlockRequestSchema,
  updateWorkoutBlockResponseSchema,
} from "@repo/contracts/workout-block";

import { getAuthenticatedUserId } from "@app/lib/auth";
import { handleApiError } from "@app/lib/error-handler";

type RouteContext = { params: Promise<{ workoutId: string; id: string }> };

export const GET = async (_: Request, context: RouteContext) => {
  try {
    const userId = await getAuthenticatedUserId();
    const { workoutId, id } = getWorkoutBlockByIdParamsSchema.parse(await context.params);
    const data = await platformWorkoutBlocksApi.getById(userId, workoutId, id);
    const validated = getWorkoutBlockResponseSchema.parse(data);

    return NextResponse.json(validated);
  } catch (error) {
    return handleApiError(error);
  }
};

export const PUT = async (request: Request, context: RouteContext) => {
  try {
    const userId = await getAuthenticatedUserId();
    const { workoutId, id } = updateWorkoutBlockParamsSchema.parse(await context.params);
    const body = await request.json();
    const data = updateWorkoutBlockRequestSchema.parse(body);
    const result = await platformWorkoutBlocksApi.update(userId, workoutId, id, data);
    const validated = updateWorkoutBlockResponseSchema.parse(result);

    return NextResponse.json(validated);
  } catch (error) {
    return handleApiError(error);
  }
};

export const DELETE = async (_: Request, context: RouteContext) => {
  try {
    const userId = await getAuthenticatedUserId();
    const { workoutId, id } = deleteWorkoutBlockParamsSchema.parse(await context.params);

    await platformWorkoutBlocksApi.delete(userId, workoutId, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
};
