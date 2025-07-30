import { adminProgramsApi } from "@repo/api";
import { NextResponse } from "next/server";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const program = await adminProgramsApi.getProgramById(id);

    if (!program) {
      return NextResponse.json({ error: "Program not found" }, { status: 404 });
    }

    return NextResponse.json(program);
  } catch (error) {
    console.error("Failed to fetch program:", error);

    return NextResponse.json({ error: "Failed to fetch program" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await request.json();
    const program = await adminProgramsApi.updateProgram(id, data);

    return NextResponse.json(program);
  } catch (error) {
    console.error("Failed to update program:", error);

    return NextResponse.json({ error: "Failed to update program" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    await adminProgramsApi.deleteProgram(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete program:", error);

    const message = error instanceof Error ? error.message : "Failed to delete program";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
