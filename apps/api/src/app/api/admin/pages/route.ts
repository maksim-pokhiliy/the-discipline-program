import { NextResponse } from "next/server";
import { z } from "zod";

import { adminPagesApi } from "@repo/api-server";
import { adminPageListItemSchema } from "@repo/contracts/pages";
import { handleApiError } from "@repo/errors";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const pages = await adminPagesApi.getPages();
    const validated = z.array(adminPageListItemSchema).parse(pages);

    return NextResponse.json(validated);
  } catch (error) {
    return handleApiError(error);
  }
}
