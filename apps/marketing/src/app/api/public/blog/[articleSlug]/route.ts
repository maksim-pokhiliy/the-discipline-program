import { createGetByParamHandler, withPublicRoute } from "@repo/api-routes";
import { cmsPagesPublicApi } from "@repo/api-server/cms";
import { blogPostPageDataSchema, getBlogArticleBySlugParamsSchema } from "@repo/contracts/cms/blog";

export const GET = withPublicRoute(
  createGetByParamHandler(
    ({ articleSlug }) => cmsPagesPublicApi.getBlogArticle(articleSlug),
    getBlogArticleBySlugParamsSchema,
    blogPostPageDataSchema,
  ),
);
