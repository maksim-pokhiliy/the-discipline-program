import { NextResponse } from "next/server";
import { type ZodType } from "zod";

import {
  parseRequest,
  parseResponse,
  withPublicRoute,
  withRateLimit,
  RATE_LIMIT_TIER,
} from "@repo/api-routes";
import type { RouteContext } from "@repo/api-routes";
import { cmsPagesPublicApi } from "@repo/api-server/cms";
import { type LocaleCode, localeQuerySchema } from "@repo/contracts/cms/locale";
import {
  getPageBySlugParamsSchema,
  getHomePageResponseSchema,
  getStorefrontProgramsPageResponseSchema,
  getAboutPageResponseSchema,
  getBlogPageResponseSchema,
  getContactPageResponseSchema,
  getFaqPageResponseSchema,
  PageSlug,
} from "@repo/contracts/cms/pages";

const PAGE_HANDLERS: Record<
  PageSlug,
  { fetch: (locale: LocaleCode) => Promise<unknown>; schema: ZodType }
> = {
  [PageSlug.HOME]: { fetch: cmsPagesPublicApi.getHomePage, schema: getHomePageResponseSchema },
  [PageSlug.STOREFRONT]: {
    fetch: cmsPagesPublicApi.getStorefrontProgramsPage,
    schema: getStorefrontProgramsPageResponseSchema,
  },
  [PageSlug.ABOUT]: { fetch: cmsPagesPublicApi.getAboutPage, schema: getAboutPageResponseSchema },
  [PageSlug.BLOG]: { fetch: cmsPagesPublicApi.getBlogPage, schema: getBlogPageResponseSchema },
  [PageSlug.CONTACT]: {
    fetch: cmsPagesPublicApi.getContactPage,
    schema: getContactPageResponseSchema,
  },
  [PageSlug.FAQ]: { fetch: cmsPagesPublicApi.getFaqPage, schema: getFaqPageResponseSchema },
};

const handler = async (request: Request, context: RouteContext): Promise<Response> => {
  const { pageSlug } = parseRequest(getPageBySlugParamsSchema, await context.params);
  const { locale } = parseRequest(
    localeQuerySchema,
    Object.fromEntries(new URL(request.url).searchParams.entries()),
  );
  const config = PAGE_HANDLERS[pageSlug];
  const data = await config.fetch(locale);

  return NextResponse.json(parseResponse(config.schema, data));
};

export const GET = withPublicRoute(withRateLimit(handler, RATE_LIMIT_TIER.PUBLIC));
