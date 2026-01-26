import { NextResponse } from "next/server";

import { adminPagesApi } from "@repo/api-server";
import { formatError } from "@repo/errors";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const pages = await adminPagesApi.getPages();

    return NextResponse.json(pages);
  } catch (error) {
    return formatError(error);
  }
}
