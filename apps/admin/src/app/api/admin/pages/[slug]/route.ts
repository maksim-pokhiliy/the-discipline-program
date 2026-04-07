import { NextResponse } from "next/server";

import { adminPagesApi } from "@repo/api-server";
import { pageSlugRouteParamsSchema, updatePageMetadataSchema } from "@repo/contracts/pages";

import { withAdminAuth } from "@app/lib/auth";

export const GET = withAdminAuth(async (_request, { params }) => {
  const { slug } = pageSlugRouteParamsSchema.parse(await params);
  const data = await adminPagesApi.getPageBySlug(slug);

  return NextResponse.json(data);
});

export const PATCH = withAdminAuth(async (request, { params }) => {
  const { slug } = pageSlugRouteParamsSchema.parse(await params);
  const body = await request.json();
  const validated = updatePageMetadataSchema.parse(body);

  await adminPagesApi.updatePageMetadata(slug, validated);

  return NextResponse.json({ success: true });
});
