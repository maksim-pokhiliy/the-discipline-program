import {
  CACHE_POLICY,
  createGetByParamHandler,
  withCacheControl,
  withPublicRoute,
} from "@repo/api-routes";
import { cmsBlogPublicApi } from "@repo/api-server/cms";
import { blogPostPageDataSchema, getBlogArticleBySlugParamsSchema } from "@repo/contracts/cms/blog";

export const GET = withPublicRoute(
  withCacheControl(
    createGetByParamHandler(
      ({ articleSlug }) => cmsBlogPublicApi.getArticle(articleSlug),
      getBlogArticleBySlugParamsSchema,
      blogPostPageDataSchema,
    ),
    CACHE_POLICY.STATIC,
  ),
);
