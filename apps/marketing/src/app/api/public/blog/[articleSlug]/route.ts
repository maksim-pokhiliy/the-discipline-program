import { NextResponse } from "next/server";

import { handleApiError } from "@repo/api-routes";
import { pagesApi } from "@repo/api-server";
import { getBlogArticleBySlugParamsSchema } from "@repo/contracts/blog";

export async function GET(_: Request, { params }: { params: Promise<{ articleSlug: string }> }) {
  try {
    const { articleSlug } = getBlogArticleBySlugParamsSchema.parse(await params);
    const article = await pagesApi.getBlogArticle(articleSlug);

    return NextResponse.json(article);
  } catch (error) {
    return handleApiError(error);
  }
}
