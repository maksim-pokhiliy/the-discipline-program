import { NextResponse } from "next/server";
import { type ZodType } from "zod";

import { CACHE_POLICY, withCacheControl, withPublicRoute } from "@repo/api-routes";
import type { RouteContext } from "@repo/api-routes";
import { cmsPagesPublicApi } from "@repo/api-server/cms";
import {
  getPageBySlugParamsSchema,
  getHomePageResponseSchema,
  getStorefrontProgramsPageResponseSchema,
  getAboutPageResponseSchema,
  getBlogPageResponseSchema,
  getContactPageResponseSchema,
  getFaqPageResponseSchema,
} from "@repo/contracts/cms/pages";
import { NotFoundError } from "@repo/errors";

const PAGE_HANDLERS: Record<string, { fetch: () => Promise<unknown>; schema: ZodType }> = {
  home: { fetch: cmsPagesPublicApi.getHomePage, schema: getHomePageResponseSchema },
  storefront: {
    fetch: cmsPagesPublicApi.getStorefrontProgramsPage,
    schema: getStorefrontProgramsPageResponseSchema,
  },
  about: { fetch: cmsPagesPublicApi.getAboutPage, schema: getAboutPageResponseSchema },
  blog: { fetch: cmsPagesPublicApi.getBlogPage, schema: getBlogPageResponseSchema },
  contact: { fetch: cmsPagesPublicApi.getContactPage, schema: getContactPageResponseSchema },
  faq: { fetch: cmsPagesPublicApi.getFaqPage, schema: getFaqPageResponseSchema },
};

const handler = async (_request: Request, context: RouteContext) => {
  const { pageSlug } = getPageBySlugParamsSchema.parse(await context.params);
  const config = PAGE_HANDLERS[pageSlug];

  if (!config) {
    throw new NotFoundError("Page not found", { pageSlug });
  }

  const data = await config.fetch();

  return NextResponse.json(config.schema.parse(data));
};

export const GET = withPublicRoute(withCacheControl(handler, CACHE_POLICY.STATIC));
