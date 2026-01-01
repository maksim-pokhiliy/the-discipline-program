import { adminBlogApi } from "@repo/api/server";
import { createBlogPostRequestSchema } from "@repo/contracts/blog";
import { handleApiError } from "@repo/errors";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const posts = await adminBlogApi.getPosts();

    return NextResponse.json(posts);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = createBlogPostRequestSchema.parse(body);
    const post = await adminBlogApi.createPost(data);

    return NextResponse.json(post);
  } catch (error) {
    return handleApiError(error);
  }
}
