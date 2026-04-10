import { type ZodType } from "zod";

import { createGetByParamHandler, withPublicRoute } from "@repo/api-routes";
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

const fetchPageBySlug = async ({ pageSlug }: { pageSlug: string }) => {
  const handler = PAGE_HANDLERS[pageSlug];

  if (!handler) {
    throw new NotFoundError("Page not found", { pageSlug });
  }

  const data = await handler.fetch();

  return handler.schema.parse(data);
};

export const GET = withPublicRoute(
  createGetByParamHandler(fetchPageBySlug, getPageBySlugParamsSchema),
);
