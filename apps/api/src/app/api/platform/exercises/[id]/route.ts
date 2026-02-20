import { NextResponse } from "next/server";

import { adminExercisesApi } from "@repo/api-server";
import {
  getExerciseByIdParamsSchema,
  getExerciseResponseSchema,
  updateExerciseParamsSchema,
  updateExerciseRequestSchema,
} from "@repo/contracts/exercise";
import { handleApiError } from "@repo/errors";

import { getAuthenticatedUserId } from "@app/lib/auth";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = async (_: Request, context: RouteContext) => {
  try {
    await getAuthenticatedUserId();
    const { id } = getExerciseByIdParamsSchema.parse(await context.params);
    const data = await adminExercisesApi.getById(id);
    const validated = getExerciseResponseSchema.parse(data);

    return NextResponse.json(validated);
  } catch (error) {
    return handleApiError(error);
  }
};

export const PUT = async (request: Request, context: RouteContext) => {
  try {
    await getAuthenticatedUserId();
    const { id } = updateExerciseParamsSchema.parse(await context.params);
    const body = await request.json();
    const data = updateExerciseRequestSchema.parse(body);
    const result = await adminExercisesApi.update(id, data);

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
};
