import { NextResponse } from "next/server";

import { adminPagesApi } from "@repo/api-server";
import { updatePageSectionSchema } from "@repo/contracts/pages";

import { withAdminAuth } from "@app/lib/auth";

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
