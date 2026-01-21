import { NextResponse } from "next/server";

import { adminStorefrontApi } from "@repo/api-server";
import {
  getStorefrontProgramByIdParamsSchema,
  updateStorefrontProgramParamsSchema,
  updateStorefrontProgramRequestSchema,
  deleteStorefrontProgramParamsSchema,
} from "@repo/contracts/storefront";
import { handleApiError } from "@repo/errors";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = getStorefrontProgramByIdParamsSchema.parse(await params);
    const program = await adminStorefrontApi.getProgramById(id);

    return NextResponse.json(program);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = updateStorefrontProgramParamsSchema.parse(await params);
    const body = await request.json();
    const data = updateStorefrontProgramRequestSchema.parse(body);
    const program = await adminStorefrontApi.updateProgram(id, data);

    return NextResponse.json(program);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = deleteStorefrontProgramParamsSchema.parse(await params);

    await adminStorefrontApi.deleteProgram(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
