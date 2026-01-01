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
      const post = await adminBlogApi.toggleBlogPostStatus(id);

      return NextResponse.json(post);
    }

    const post = await adminBlogApi.toggleBlogPostFeatured(id);

    return NextResponse.json(post);
  } catch (error) {
    return handleApiError(error);
  }
}
