import { NextResponse } from "next/server";

import { adminExerciseCategoriesApi } from "@repo/api-server";
import {
  deleteExerciseCategoryParamsSchema,
  updateExerciseCategoryParamsSchema,
  updateExerciseCategoryRequestSchema,
} from "@repo/contracts/exercise-category";
import { handleApiError } from "@repo/errors";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = updateExerciseCategoryParamsSchema.parse(await params);
    const body = await request.json();
    const data = updateExerciseCategoryRequestSchema.parse(body);
    const category = await adminExerciseCategoriesApi.update(id, data);

    return NextResponse.json(category);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = deleteExerciseCategoryParamsSchema.parse(await params);

    await adminExerciseCategoriesApi.delete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
