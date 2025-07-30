import { adminProgramsApi } from "@repo/api";
import { NextResponse } from "next/server";

export async function PATCH(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const program = await adminProgramsApi.toggleProgramStatus(id);

    return NextResponse.json(program);
  } catch (error) {
    console.error("Failed to toggle program status:", error);

    const message = error instanceof Error ? error.message : "Failed to toggle program status";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
