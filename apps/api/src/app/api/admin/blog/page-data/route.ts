import { adminBlogApi } from "@repo/api/server";
import { getBlogPageDataResponseSchema } from "@repo/contracts/blog";
import { handleApiError } from "@repo/errors";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const pageData = await adminBlogApi.getBlogPageData();
    const validated = getBlogPageDataResponseSchema.parse(pageData);

    return NextResponse.json(validated);
  } catch (error) {
    return handleApiError(error);
  }
}
