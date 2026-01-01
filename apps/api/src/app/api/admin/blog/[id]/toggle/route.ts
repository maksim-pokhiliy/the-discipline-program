import { adminBlogApi } from "@repo/api/server";
import { toggleBlogPostParamsSchema, toggleBlogPostQuerySchema } from "@repo/contracts/blog";
import { handleApiError } from "@repo/errors";
import { NextResponse } from "next/server";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = toggleBlogPostParamsSchema.parse(await params);
    const url = new URL(request.url);

    const { field } = toggleBlogPostQuerySchema.parse({
      field: url.searchParams.get("field"),
    });

    if (field === "isPublished") {
      return NextResponse.json(await adminBlogApi.toggleBlogPostStatus(id));
    }

    return NextResponse.json(await adminBlogApi.toggleBlogPostFeatured(id));
  } catch (error) {
    return handleApiError(error);
  }
}
