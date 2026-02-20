import { NextResponse } from "next/server";

import { adminBlogApi } from "@repo/api-server";
import { toggleBlogPostParamsSchema, toggleBlogPostQuerySchema } from "@repo/contracts/blog";

import { withAdminAuth } from "@app/lib/auth";

export const PATCH = withAdminAuth(async (request, { params }) => {
  const { id } = toggleBlogPostParamsSchema.parse(await params);
  const url = new URL(request.url);

  const { field } = toggleBlogPostQuerySchema.parse({
    field: url.searchParams.get("field"),
  });

  if (field === "isPublished") {
    return NextResponse.json(await adminBlogApi.toggleBlogPostStatus(id));
  }

  return NextResponse.json(await adminBlogApi.toggleBlogPostFeatured(id));
});
