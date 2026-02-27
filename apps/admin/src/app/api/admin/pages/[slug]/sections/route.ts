import { NextResponse } from "next/server";

import { withAdminAuth } from "@repo/api-routes/auth";
import { adminPagesApi } from "@repo/api-server";
import { updatePageSectionSchema } from "@repo/contracts/pages";

export const PATCH = withAdminAuth(async (request, { params }) => {
  const { slug } = (await params) as { slug: string };
  const body = await request.json();

  const validatedData = updatePageSectionSchema.parse({
    ...body,
    pageSlug: slug,
  });

  await adminPagesApi.updateSection(validatedData);

  return NextResponse.json({ success: true });
});
