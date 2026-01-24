import { NextResponse } from "next/server";

import { adminPagesApi } from "@repo/api-server";
import { handleApiError } from "@repo/errors";

export async function GET() {
  try {
    const pages = await adminPagesApi.getPages();

    return NextResponse.json(pages);
  } catch (error) {
    return handleApiError(error);
  }
}
