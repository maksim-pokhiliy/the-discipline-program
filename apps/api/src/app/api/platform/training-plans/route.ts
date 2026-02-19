import { NextResponse } from "next/server";

import { platformTrainingPlansApi } from "@repo/api-server";
import {
  createTrainingPlanRequestSchema,
  createTrainingPlanResponseSchema,
  getTrainingPlansResponseSchema,
} from "@repo/contracts/training-plan";
import { handleApiError } from "@repo/errors";

import { getAuthenticatedUserId } from "@app/lib/auth";

export const GET = async () => {
  try {
    const userId = await getAuthenticatedUserId();
    const data = await platformTrainingPlansApi.getAll(userId);
    const validated = getTrainingPlansResponseSchema.parse(data);

    return NextResponse.json(validated);
  } catch (error) {
    return handleApiError(error);
  }
};

export const POST = async (request: Request) => {
  try {
    const userId = await getAuthenticatedUserId();
    const body = await request.json();
    const data = createTrainingPlanRequestSchema.parse(body);
    const result = await platformTrainingPlansApi.create(userId, data);
    const validated = createTrainingPlanResponseSchema.parse(result);

    return NextResponse.json(validated, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
};
