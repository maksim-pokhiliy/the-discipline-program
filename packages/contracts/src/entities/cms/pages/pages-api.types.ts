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
  type SECTION_SCHEMAS,
} from "./pages-api.schema";
import { type SectionSchemaKey } from "./pages.types";

export type AdminPageListItem = z.infer<typeof adminPageListItemSchema>;
export type AdminPageDetails = z.infer<typeof adminPageDetailsSchema>;
export type UpdatePageSectionBody = z.input<typeof updatePageSectionBodySchema>;
export type UpdatePageSectionData = z.input<typeof updatePageSectionSchema>;

type SectionSchemas = typeof SECTION_SCHEMAS;

export type SectionWriteData = {
  [TKey in SectionSchemaKey]: z.input<ReturnType<SectionSchemas[TKey]["deepPartial"]>>;
};

type SectionReadData = {
  [TKey in SectionSchemaKey]: z.output<ReturnType<SectionSchemas[TKey]["deepPartial"]>>;
};

export type SectionWriteBody<TKey extends SectionSchemaKey = SectionSchemaKey> = {
  [TSection in TKey]: {
    section: TSection;
    data: SectionWriteData[TSection];
    locale?: UpdatePageSectionBody["locale"];
  };
}[TKey];

export type AdminPageSection<TKey extends SectionSchemaKey = SectionSchemaKey> = {
  [TSection in TKey]: Omit<AdminPageDetails["sections"][number], "section" | "data"> & {
    section: TSection;
    data: SectionReadData[TSection];
  };
}[TKey];

export type CorrelatedAdminPageDetails = Omit<AdminPageDetails, "sections"> & {
  sections: AdminPageSection[];
};

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
