import { type z } from "zod";

import {
  type getPageBySlugParamsSchema,
  type getHomePageResponseSchema,
  type getStorefrontProgramsPageResponseSchema,
  type getAboutPageResponseSchema,
  type getBlogPageResponseSchema,
  type getContactPageResponseSchema,
} from "./pages-api.schema";

export type GetPageBySlugParams = z.infer<typeof getPageBySlugParamsSchema>;

export type HomePageData = z.infer<typeof getHomePageResponseSchema>;

export type StorefrontProgramsPageData = z.infer<typeof getStorefrontProgramsPageResponseSchema>;

export type AboutPageData = z.infer<typeof getAboutPageResponseSchema>;

export type BlogPageData = z.infer<typeof getBlogPageResponseSchema>;

export type ContactPageData = z.infer<typeof getContactPageResponseSchema>;
