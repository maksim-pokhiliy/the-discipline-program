import { NextResponse } from "next/server";
import { z } from "zod";

import { adminPagesApi } from "@repo/api-server";
import { adminPageListItemSchema } from "@repo/contracts/pages";

import { withAdminAuth } from "@app/lib/auth";

export const dynamic = "force-dynamic";

export const GET = withAdminAuth(async () => {
  const pages = await adminPagesApi.getPages();
  const validated = z.array(adminPageListItemSchema).parse(pages);

  return NextResponse.json(validated);
});
