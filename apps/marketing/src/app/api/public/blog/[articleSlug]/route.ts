import { createGetByParamHandler, withPublicRoute } from "@repo/api-routes";
import { pagesApi } from "@repo/api-server";
import { blogPostPageDataSchema, getBlogArticleBySlugParamsSchema } from "@repo/contracts/blog";

export const GET = withPublicRoute(
  createGetByParamHandler(
    ({ articleSlug }) => pagesApi.getBlogArticle(articleSlug),
    getBlogArticleBySlugParamsSchema,
    blogPostPageDataSchema,
  ),
);
