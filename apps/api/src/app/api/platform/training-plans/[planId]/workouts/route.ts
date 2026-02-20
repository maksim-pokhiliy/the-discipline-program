import { NextResponse } from "next/server";

import { platformWorkoutsApi } from "@repo/api-server";
import {
  createWorkoutParamsSchema,
  createWorkoutRequestSchema,
  createWorkoutResponseSchema,
  getWorkoutsParamsSchema,
  getWorkoutsResponseSchema,
} from "@repo/contracts/workout";

import { getAuthenticatedUserId } from "@app/lib/auth";
import { handleApiError } from "@app/lib/error-handler";

type RouteContext = { params: Promise<{ planId: string }> };

export const GET = async (_: Request, context: RouteContext) => {
  try {
    const userId = await getAuthenticatedUserId();
    const { planId } = getWorkoutsParamsSchema.parse(await context.params);
    const data = await platformWorkoutsApi.getAll(userId, planId);
    const validated = getWorkoutsResponseSchema.parse(data);

    return NextResponse.json(validated);
  } catch (error) {
    return handleApiError(error);
  }
};

export const POST = async (request: Request, context: RouteContext) => {
  try {
    const userId = await getAuthenticatedUserId();
    const { planId } = createWorkoutParamsSchema.parse(await context.params);
    const body = await request.json();
    const data = createWorkoutRequestSchema.parse(body);
    const result = await platformWorkoutsApi.create(userId, planId, data);
    const validated = createWorkoutResponseSchema.parse(result);

    return NextResponse.json(validated, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
};
