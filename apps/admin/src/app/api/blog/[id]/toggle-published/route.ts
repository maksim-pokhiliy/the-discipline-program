import { adminBlogApi } from "@repo/api";
import { NextResponse } from "next/server";

export async function PATCH(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const post = await adminBlogApi.togglePublished(id);

    return NextResponse.json(post);
  } catch (error) {
    console.error("Failed to toggle blog publish state:", error);

    const message = error instanceof Error ? error.message : "Failed to toggle publish state";

    const status = message.includes("not found") ? 404 : 400;

    return NextResponse.json({ error: message }, { status });
  }
}
