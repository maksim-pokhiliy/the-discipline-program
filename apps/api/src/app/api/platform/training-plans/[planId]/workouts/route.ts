import { NextResponse } from "next/server";

import { platformWorkoutsApi } from "@repo/api-server";
import {
  createWorkoutParamsSchema,
  createWorkoutRequestSchema,
  getWorkoutsParamsSchema,
  getWorkoutsResponseSchema,
} from "@repo/contracts/workout";
import { handleApiError } from "@repo/errors";

import { getAuthenticatedUserId } from "@app/lib/auth";

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

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
};
