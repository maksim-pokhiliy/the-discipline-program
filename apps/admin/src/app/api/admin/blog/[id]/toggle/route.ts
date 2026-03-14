import { NextResponse } from "next/server";

import { withAdminAuth } from "@repo/api-routes/auth";
import { adminBlogApi } from "@repo/api-server";
import {
  BlogToggleField,
  toggleBlogPostParamsSchema,
  toggleBlogPostQuerySchema,
} from "@repo/contracts/blog";

const toggleHandlers: Record<BlogToggleField, (id: string) => Promise<unknown>> = {
  [BlogToggleField.IS_PUBLISHED]: adminBlogApi.toggleBlogPostStatus,
  [BlogToggleField.IS_FEATURED]: adminBlogApi.toggleBlogPostFeatured,
};

export const PATCH = withAdminAuth(async (request, { params }) => {
  const { id } = toggleBlogPostParamsSchema.parse(await params);
  const { field } = toggleBlogPostQuerySchema.parse({
    field: new URL(request.url).searchParams.get("field"),
  });

  return NextResponse.json(await toggleHandlers[field](id));
});
