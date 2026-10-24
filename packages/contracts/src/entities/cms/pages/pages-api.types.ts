import { type z } from "zod";

import {
  type adminPageListItemSchema,
  type adminPageDetailsSchema,
  type getPageBySlugParamsSchema,
  type pageSlugRouteParamsSchema,
  type updatePageSectionBodySchema,
  type updatePageSectionSchema,
  type getHomePageResponseSchema,
  type getStorefrontProgramsPageResponseSchema,
  type getAboutPageResponseSchema,
  type getBlogPageResponseSchema,
  type getContactPageResponseSchema,
  type getFaqPageResponseSchema,
  type getOfferPageResponseSchema,
  type getSitePageResponseSchema,
  type revalidateQuerySchema,
} from "./pages-api.schema";

export type AdminPageListItem = z.infer<typeof adminPageListItemSchema>;
export type AdminPageDetails = z.infer<typeof adminPageDetailsSchema>;
export type UpdatePageSectionBody = z.input<typeof updatePageSectionBodySchema>;
export type UpdatePageSectionData = z.input<typeof updatePageSectionSchema>;

export type HomePageData = z.infer<typeof getHomePageResponseSchema>;
export type StorefrontProgramsPageData = z.infer<typeof getStorefrontProgramsPageResponseSchema>;
export type AboutPageData = z.infer<typeof getAboutPageResponseSchema>;
export type BlogPageData = z.infer<typeof getBlogPageResponseSchema>;
export type ContactPageData = z.infer<typeof getContactPageResponseSchema>;
export type FaqPageData = z.infer<typeof getFaqPageResponseSchema>;
export type OfferPageData = z.infer<typeof getOfferPageResponseSchema>;
export type SitePageData = z.infer<typeof getSitePageResponseSchema>;
export type PageSlugRouteParams = z.infer<typeof pageSlugRouteParamsSchema>;
export type GetPageBySlugParams = z.infer<typeof getPageBySlugParamsSchema>;
export type MarketingRevalidationTarget = z.infer<typeof revalidateQuerySchema>;
