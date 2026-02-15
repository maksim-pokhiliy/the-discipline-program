import { NextResponse } from "next/server";

import { adminExerciseCategoriesApi } from "@repo/api-server";
import {
  createExerciseCategoryRequestSchema,
  getExerciseCategoriesResponseSchema,
} from "@repo/contracts/exercise-category";
import { handleApiError } from "@repo/errors";

export async function GET() {
  try {
    const categories = await adminExerciseCategoriesApi.getAll();
    const validated = getExerciseCategoriesResponseSchema.parse(categories);

    return NextResponse.json(validated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = createExerciseCategoryRequestSchema.parse(body);
    const category = await adminExerciseCategoriesApi.create(data);

    return NextResponse.json(category);
  } catch (error) {
    return handleApiError(error);
  }
}
