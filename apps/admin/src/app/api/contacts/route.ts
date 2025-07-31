import { contactApi } from "@repo/api";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const contacts = await contactApi.getSubmissions();

    return NextResponse.json(contacts);
  } catch (error) {
    console.error("Failed to fetch contacts:", error);

    return NextResponse.json({ error: "Failed to fetch contacts" }, { status: 500 });
  }
}
