import { adminBlogApi } from "@repo/api";
import { NextResponse } from "next/server";

export async function PATCH(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const post = await adminBlogApi.toggleFeatured(id);

    return NextResponse.json(post);
  } catch (error) {
    console.error("Failed to toggle blog featured state:", error);

    const message = error instanceof Error ? error.message : "Failed to toggle featured state";

    const status = message.includes("not found") ? 404 : 400;

    return NextResponse.json({ error: message }, { status });
  }
}
