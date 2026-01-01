import { pagesApi } from "@repo/api/server";
import { getBlogArticleBySlugParamsSchema } from "@repo/contracts/blog";
import { handleApiError } from "@repo/errors";
import { NextResponse } from "next/server";

export async function GET(_: Request, { params }: { params: Promise<{ articleSlug: string }> }) {
  try {
    const { articleSlug } = getBlogArticleBySlugParamsSchema.parse(await params);
    const article = await pagesApi.getBlogArticle(articleSlug);

    return NextResponse.json(article);
  } catch (error) {
    return handleApiError(error);
  }
}
