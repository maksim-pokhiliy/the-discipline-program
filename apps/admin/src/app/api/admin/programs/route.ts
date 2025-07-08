import { adminProgramsApi } from "@repo/api";
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
