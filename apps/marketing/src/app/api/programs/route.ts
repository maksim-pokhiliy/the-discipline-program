import { programsApi } from "@repo/api/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const programs = await programsApi.getPrograms();

    return NextResponse.json(programs);
  } catch (error) {
    console.error("Failed to fetch programs:", error);

    return NextResponse.json({ error: "Failed to fetch programs" }, { status: 500 });
  }
}
