import { adminBlogApi } from "@repo/api/server";
import {
  getBlogPostByIdParamsSchema,
  updateBlogPostRequestSchema,
  deleteBlogPostParamsSchema,
} from "@repo/contracts/blog";
import { handleApiError } from "@repo/errors";
import { NextResponse } from "next/server";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = getBlogPostByIdParamsSchema.parse(await params);
    const post = await adminBlogApi.getPostById(id);

    if (!post) {
      return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = updateBlogPostRequestSchema.parse(body);
    const post = await adminBlogApi.updatePost(id, data);

    return NextResponse.json(post);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = deleteBlogPostParamsSchema.parse(await params);

    await adminBlogApi.deletePost(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
