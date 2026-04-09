import { NextResponse } from "next/server";

import { adminPagesApi } from "@repo/api-server";
import {
  adminPageDetailsSchema,
  pageSlugRouteParamsSchema,
  updatePageMetadataSchema,
} from "@repo/contracts/pages";

import { withAdminAuth } from "@app/lib/server/auth";

export const GET = withAdminAuth(async (_request, { params }) => {
  const { slug } = pageSlugRouteParamsSchema.parse(await params);
  const data = await adminPagesApi.getPageBySlug(slug);
  const validated = adminPageDetailsSchema.parse(data);

  return NextResponse.json(validated);
});

export const PATCH = withAdminAuth(async (request, { params }) => {
  const { slug } = pageSlugRouteParamsSchema.parse(await params);
  const body = await request.json();
  const validated = updatePageMetadataSchema.parse(body);

  await adminPagesApi.updatePageMetadata(slug, validated);

  return NextResponse.json({ success: true });
});
