import { adminProgramsApi } from "@repo/api/server";
import { toggleProgramStatusParamsSchema } from "@repo/contracts/program";
import { handleApiError } from "@repo/errors";
import { NextResponse } from "next/server";

export async function PATCH(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = toggleProgramStatusParamsSchema.parse(await params);
    const program = await adminProgramsApi.toggleProgramStatus(id);

    return NextResponse.json(program);
  } catch (error) {
    return handleApiError(error);
  }
}
