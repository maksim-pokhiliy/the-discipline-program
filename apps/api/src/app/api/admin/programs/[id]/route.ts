import { adminProgramsApi } from "@repo/api/server";
import {
  getProgramByIdParamsSchema,
  updateProgramRequestSchema,
  deleteProgramParamsSchema,
} from "@repo/contracts/program";
import { handleApiError } from "@repo/errors";
import { NextResponse } from "next/server";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = getProgramByIdParamsSchema.parse(await params);
    const program = await adminProgramsApi.getProgramById(id);

    if (!program) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }

    return NextResponse.json(program);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = updateProgramRequestSchema.parse(body);
    const program = await adminProgramsApi.updateProgram(id, data);

    return NextResponse.json(program);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = deleteProgramParamsSchema.parse(await params);

    await adminProgramsApi.deleteProgram(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
