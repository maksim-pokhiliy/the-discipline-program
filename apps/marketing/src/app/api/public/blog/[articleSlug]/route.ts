import {
  CACHE_POLICY,
  createGetByParamHandler,
  withCacheControl,
  withPublicRoute,
  withRateLimit,
  RATE_LIMIT_TIER,
} from "@repo/api-routes";
import { cmsBlogPublicApi } from "@repo/api-server/cms";
import { blogPostPageDataSchema, getBlogArticleBySlugParamsSchema } from "@repo/contracts/cms/blog";

export const GET = withPublicRoute(
  withRateLimit(
    withCacheControl(
      createGetByParamHandler(
        ({ articleSlug }) => cmsBlogPublicApi.getArticle(articleSlug),
        getBlogArticleBySlugParamsSchema,
        blogPostPageDataSchema,
      ),
      CACHE_POLICY.STATIC,
    ),
    RATE_LIMIT_TIER.PUBLIC,
  ),
);
