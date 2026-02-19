import { NextResponse } from "next/server";

import { platformWorkoutsApi } from "@repo/api-server";
import {
  deleteWorkoutParamsSchema,
  getWorkoutByIdParamsSchema,
  getWorkoutResponseSchema,
  updateWorkoutParamsSchema,
  updateWorkoutRequestSchema,
} from "@repo/contracts/workout";
import { handleApiError } from "@repo/errors";

import { getAuthenticatedUserId } from "@app/lib/auth";

type RouteContext = { params: Promise<{ planId: string; id: string }> };

export const GET = async (_: Request, context: RouteContext) => {
  try {
    const userId = await getAuthenticatedUserId();
    const { planId, id } = getWorkoutByIdParamsSchema.parse(await context.params);
    const data = await platformWorkoutsApi.getById(userId, planId, id);
    const validated = getWorkoutResponseSchema.parse(data);

    return NextResponse.json(validated);
  } catch (error) {
    return handleApiError(error);
  }
};

export const PUT = async (request: Request, context: RouteContext) => {
  try {
    const userId = await getAuthenticatedUserId();
    const { planId, id } = updateWorkoutParamsSchema.parse(await context.params);
    const body = await request.json();
    const data = updateWorkoutRequestSchema.parse(body);
    const result = await platformWorkoutsApi.update(userId, planId, id, data);

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
};

export const DELETE = async (_: Request, context: RouteContext) => {
  try {
    const userId = await getAuthenticatedUserId();
    const { planId, id } = deleteWorkoutParamsSchema.parse(await context.params);

    await platformWorkoutsApi.delete(userId, planId, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
};
