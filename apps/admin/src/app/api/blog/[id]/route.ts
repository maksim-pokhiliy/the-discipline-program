import { adminBlogApi } from "@repo/api";
import { NextResponse } from "next/server";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const review = await adminBlogApi.getPostById(id);

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    return NextResponse.json(review);
  } catch (error) {
    console.error("Failed to fetch review:", error);

    return NextResponse.json({ error: "Failed to fetch review" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await request.json();
    const review = await adminBlogApi.updatePost(id, data);

    return NextResponse.json(review);
  } catch (error) {
    console.error("Failed to update review:", error);

    return NextResponse.json({ error: "Failed to update review" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    await adminBlogApi.deletePost(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete review:", error);

    const message = error instanceof Error ? error.message : "Failed to delete review";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
