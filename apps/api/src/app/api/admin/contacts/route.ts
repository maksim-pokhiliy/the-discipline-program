import { contactApi } from "@repo/api/server";
import { handleApiError } from "@repo/errors";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const contacts = await contactApi.getSubmissions();

    return NextResponse.json(contacts);
  } catch (error) {
    return handleApiError(error);
  }
}
