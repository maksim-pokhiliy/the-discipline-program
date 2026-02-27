import { NextResponse } from "next/server";

import { withPlatformAuth } from "@repo/api-routes/auth";
import { adminExerciseCategoriesApi } from "@repo/api-server";
import {
  createExerciseCategoryRequestSchema,
  getExerciseCategoriesResponseSchema,
} from "@repo/contracts/exercise-category";

export const GET = withPlatformAuth(async () => {
  const data = await adminExerciseCategoriesApi.getAll();
  const validated = getExerciseCategoriesResponseSchema.parse(data);

  return NextResponse.json(validated);
});

export const POST = withPlatformAuth(async (request) => {
  const body = await request.json();
  const data = createExerciseCategoryRequestSchema.parse(body);
  const result = await adminExerciseCategoriesApi.create(data);

  return NextResponse.json(result, { status: 201 });
});
