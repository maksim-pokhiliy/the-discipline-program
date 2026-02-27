import { NextResponse } from "next/server";
import { z } from "zod";

import { withAdminAuth } from "@repo/api-routes/auth";
import { adminPagesApi } from "@repo/api-server";
import { adminPageListItemSchema } from "@repo/contracts/pages";

export const dynamic = "force-dynamic";

export const GET = withAdminAuth(async () => {
  const pages = await adminPagesApi.getPages();
  const validated = z.array(adminPageListItemSchema).parse(pages);

  return NextResponse.json(validated);
});
