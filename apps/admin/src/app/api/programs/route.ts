import { adminProgramsApi } from "@repo/api/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const programs = await adminProgramsApi.getPrograms();

    return NextResponse.json(programs);
  } catch (error) {
    console.error("Failed to fetch programs:", error);

    return NextResponse.json({ error: "Failed to fetch programs" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const program = await adminProgramsApi.createProgram(data);

    return NextResponse.json(program);
  } catch (error) {
    console.error("Failed to create program:", error);

    return NextResponse.json({ error: "Failed to create program" }, { status: 500 });
  }
}
