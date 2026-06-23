import {
  createGetByParamHandler,
  withPublicRoute,
  withRateLimit,
  RATE_LIMIT_TIER,
} from "@repo/api-routes";
import { cmsBlogPublicApi } from "@repo/api-server/cms";
import { blogPostPageDataSchema, getBlogArticleBySlugParamsSchema } from "@repo/contracts/cms/blog";

export const GET = withPublicRoute(
  withRateLimit(
    createGetByParamHandler(
      ({ articleSlug }) => cmsBlogPublicApi.getArticle(articleSlug),
      getBlogArticleBySlugParamsSchema,
      blogPostPageDataSchema,
    ),
    RATE_LIMIT_TIER.PUBLIC,
  ),
);
