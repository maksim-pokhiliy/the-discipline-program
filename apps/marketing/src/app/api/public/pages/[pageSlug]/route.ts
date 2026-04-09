import { type ZodType } from "zod";

import { createGetByParamHandler, withPublicRoute } from "@repo/api-routes";
import { pagesApi } from "@repo/api-server";
import {
  getPageBySlugParamsSchema,
  getHomePageResponseSchema,
  getStorefrontProgramsPageResponseSchema,
  getAboutPageResponseSchema,
  getBlogPageResponseSchema,
  getContactPageResponseSchema,
  getFaqPageResponseSchema,
} from "@repo/contracts/pages";
import { NotFoundError } from "@repo/errors";

const PAGE_HANDLERS: Record<string, { fetch: () => Promise<unknown>; schema: ZodType }> = {
  home: { fetch: pagesApi.getHomePage, schema: getHomePageResponseSchema },
  storefront: {
    fetch: pagesApi.getStorefrontProgramsPage,
    schema: getStorefrontProgramsPageResponseSchema,
  },
  about: { fetch: pagesApi.getAboutPage, schema: getAboutPageResponseSchema },
  blog: { fetch: pagesApi.getBlogPage, schema: getBlogPageResponseSchema },
  contact: { fetch: pagesApi.getContactPage, schema: getContactPageResponseSchema },
  faq: { fetch: pagesApi.getFaqPage, schema: getFaqPageResponseSchema },
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
