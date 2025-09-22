import { adminBlogApi } from "@repo/api";
import { NextResponse } from "next/server";

import { normalizeUpdateBlogPayload } from "../utils";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const post = await adminBlogApi.getPostById(id);

    if (!post) {
      return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error("Failed to fetch blog post:", error);

    return NextResponse.json({ error: "Failed to fetch blog post" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = normalizeUpdateBlogPayload(body);
    const post = await adminBlogApi.updatePost(id, data);

    return NextResponse.json(post);
  } catch (error) {
    console.error("Failed to update blog post:", error);

    const message = error instanceof Error ? error.message : "Failed to update blog post";

    const status = message.includes("not found") ? 404 : 400;

    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    await adminBlogApi.deletePost(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete blog post:", error);

    const message = error instanceof Error ? error.message : "Failed to delete blog post";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
