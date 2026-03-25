import { type z } from "zod";

import {
  type adminPageListItemSchema,
  type adminPageDetailsSchema,
  type updatePageSectionSchema,
  type getHomePageResponseSchema,
  type getStorefrontProgramsPageResponseSchema,
  type getAboutPageResponseSchema,
  type getBlogPageResponseSchema,
  type getContactPageResponseSchema,
  type getFaqPageResponseSchema,
  type updatePageMetadataSchema,
} from "./pages-api.schema";

export type AdminPageListItem = z.infer<typeof adminPageListItemSchema>;
export type AdminPageDetails = z.infer<typeof adminPageDetailsSchema>;
export type UpdatePageSectionData = z.infer<typeof updatePageSectionSchema>;
export type UpdatePageMetadataInput = z.infer<typeof updatePageMetadataSchema>;

export type HomePageData = z.infer<typeof getHomePageResponseSchema>;
export type StorefrontProgramsPageData = z.infer<typeof getStorefrontProgramsPageResponseSchema>;
export type AboutPageData = z.infer<typeof getAboutPageResponseSchema>;
export type BlogPageData = z.infer<typeof getBlogPageResponseSchema>;
export type ContactPageData = z.infer<typeof getContactPageResponseSchema>;
export type FaqPageData = z.infer<typeof getFaqPageResponseSchema>;
