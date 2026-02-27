import { NextResponse } from "next/server";

import { withAdminAuth } from "@repo/api-routes/auth";
import { adminPagesApi } from "@repo/api-server";
import { updatePageMetadataSchema } from "@repo/contracts/pages";

export const GET = withAdminAuth(async (_request, { params }) => {
  const { slug } = (await params) as { slug: string };
  const data = await adminPagesApi.getPageBySlug(slug);

  return NextResponse.json(data);
});

export const PATCH = withAdminAuth(async (request, { params }) => {
  const { slug } = (await params) as { slug: string };
  const body = await request.json();
  const validated = updatePageMetadataSchema.parse(body);

  await adminPagesApi.updatePageMetadata(slug, validated);

  return NextResponse.json({ success: true });
});
