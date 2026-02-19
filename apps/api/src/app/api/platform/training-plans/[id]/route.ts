import { NextResponse } from "next/server";

import { platformTrainingPlansApi } from "@repo/api-server";
import {
  deleteTrainingPlanParamsSchema,
  getTrainingPlanByIdParamsSchema,
  getTrainingPlanResponseSchema,
  updateTrainingPlanParamsSchema,
  updateTrainingPlanRequestSchema,
  updateTrainingPlanResponseSchema,
} from "@repo/contracts/training-plan";
import { handleApiError } from "@repo/errors";

import { getAuthenticatedUserId } from "@app/lib/auth";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = async (_: Request, context: RouteContext) => {
  try {
    const userId = await getAuthenticatedUserId();
    const { id } = getTrainingPlanByIdParamsSchema.parse(await context.params);
    const data = await platformTrainingPlansApi.getById(userId, id);
    const validated = getTrainingPlanResponseSchema.parse(data);

    return NextResponse.json(validated);
  } catch (error) {
    return handleApiError(error);
  }
};

export const PUT = async (request: Request, context: RouteContext) => {
  try {
    const userId = await getAuthenticatedUserId();
    const { id } = updateTrainingPlanParamsSchema.parse(await context.params);
    const body = await request.json();
    const data = updateTrainingPlanRequestSchema.parse(body);
    const result = await platformTrainingPlansApi.update(userId, id, data);
    const validated = updateTrainingPlanResponseSchema.parse(result);

    return NextResponse.json(validated);
  } catch (error) {
    return handleApiError(error);
  }
};

export const DELETE = async (_: Request, context: RouteContext) => {
  try {
    const userId = await getAuthenticatedUserId();
    const { id } = deleteTrainingPlanParamsSchema.parse(await context.params);

    await platformTrainingPlansApi.delete(userId, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
};
