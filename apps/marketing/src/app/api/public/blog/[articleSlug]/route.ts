import { NextResponse } from "next/server";

import { withPublicRoute } from "@repo/api-routes";
import { pagesApi } from "@repo/api-server";
import { getBlogArticleBySlugParamsSchema } from "@repo/contracts/blog";

export const GET = withPublicRoute(async (_, context) => {
  const { articleSlug } = getBlogArticleBySlugParamsSchema.parse(await context.params);
  const article = await pagesApi.getBlogArticle(articleSlug);

  return NextResponse.json(article);
});
