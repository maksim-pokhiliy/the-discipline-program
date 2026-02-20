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

import { getAuthenticatedUserId } from "@app/lib/auth";
import { handleApiError } from "@app/lib/error-handler";

type RouteContext = { params: Promise<{ planId: string }> };

export const GET = async (_: Request, context: RouteContext) => {
  try {
    const userId = await getAuthenticatedUserId();
    const { planId } = getTrainingPlanByIdParamsSchema.parse(await context.params);
    const data = await platformTrainingPlansApi.getById(userId, planId);
    const validated = getTrainingPlanResponseSchema.parse(data);

    return NextResponse.json(validated);
  } catch (error) {
    return handleApiError(error);
  }
};

export const PUT = async (request: Request, context: RouteContext) => {
  try {
    const userId = await getAuthenticatedUserId();
    const { planId } = updateTrainingPlanParamsSchema.parse(await context.params);
    const body = await request.json();
    const data = updateTrainingPlanRequestSchema.parse(body);
    const result = await platformTrainingPlansApi.update(userId, planId, data);
    const validated = updateTrainingPlanResponseSchema.parse(result);

    return NextResponse.json(validated);
  } catch (error) {
    return handleApiError(error);
  }
};

export const DELETE = async (_: Request, context: RouteContext) => {
  try {
    const userId = await getAuthenticatedUserId();
    const { planId } = deleteTrainingPlanParamsSchema.parse(await context.params);

    await platformTrainingPlansApi.delete(userId, planId);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
};
