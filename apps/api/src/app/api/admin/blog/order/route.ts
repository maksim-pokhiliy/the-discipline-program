import { NextResponse } from "next/server";

import { adminBlogApi } from "@repo/api-server";
import { updateBlogPostsOrderRequestSchema } from "@repo/contracts/blog";
import { handleApiError } from "@repo/errors";

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const updates = updateBlogPostsOrderRequestSchema.parse(body);
    const posts = await adminBlogApi.updatePostsOrder(updates);

    return NextResponse.json(posts);
  } catch (error) {
    return handleApiError(error);
  }
}
