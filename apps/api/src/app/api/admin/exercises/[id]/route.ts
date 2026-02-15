import { NextResponse } from "next/server";

import { adminExercisesApi } from "@repo/api-server";
import {
  deleteExerciseParamsSchema,
  getExerciseByIdParamsSchema,
  updateExerciseParamsSchema,
  updateExerciseRequestSchema,
} from "@repo/contracts/exercise";
import { handleApiError } from "@repo/errors";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = getExerciseByIdParamsSchema.parse(await params);
    const exercise = await adminExercisesApi.getById(id);

    return NextResponse.json(exercise);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = updateExerciseParamsSchema.parse(await params);
    const body = await request.json();
    const data = updateExerciseRequestSchema.parse(body);
    const exercise = await adminExercisesApi.update(id, data);

    return NextResponse.json(exercise);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = deleteExerciseParamsSchema.parse(await params);

    await adminExercisesApi.delete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
