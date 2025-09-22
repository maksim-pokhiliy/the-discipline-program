import { adminBlogApi } from "@repo/api";
import { NextResponse } from "next/server";

import { normalizeCreateBlogPayload } from "./utils";

export async function GET() {
  try {
    const posts = await adminBlogApi.getPosts();

    return NextResponse.json(posts);
  } catch (error) {
    console.error("Failed to fetch blog posts:", error);

    return NextResponse.json({ error: "Failed to fetch blog posts" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = normalizeCreateBlogPayload(body);
    const post = await adminBlogApi.createPost(data);

    return NextResponse.json(post);
  } catch (error) {
    console.error("Failed to create blog post:", error);

    const message = error instanceof Error ? error.message : "Failed to create blog post";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
