import { NextResponse } from "next/server";

import { adminExerciseCategoriesApi } from "@repo/api-server";
import {
  createExerciseCategoryRequestSchema,
  getExerciseCategoriesResponseSchema,
} from "@repo/contracts/exercise-category";
import { handleApiError } from "@repo/errors";

import { getAuthenticatedUserId } from "@app/lib/auth";

export const GET = async () => {
  try {
    await getAuthenticatedUserId();
    const data = await adminExerciseCategoriesApi.getAll();
    const validated = getExerciseCategoriesResponseSchema.parse(data);

    return NextResponse.json(validated);
  } catch (error) {
    return handleApiError(error);
  }
};

export const POST = async (request: Request) => {
  try {
    await getAuthenticatedUserId();
    const body = await request.json();
    const data = createExerciseCategoryRequestSchema.parse(body);
    const result = await adminExerciseCategoriesApi.create(data);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
};
