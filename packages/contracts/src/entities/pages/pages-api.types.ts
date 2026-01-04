import { type z } from "zod";

import {
  type getPageBySlugParamsSchema,
  type getHomePageResponseSchema,
  type getProgramsPageResponseSchema,
  type getAboutPageResponseSchema,
  type getBlogPageResponseSchema,
  type getContactPageResponseSchema,
} from "./pages-api.schema";

export type GetPageBySlugParams = z.infer<typeof getPageBySlugParamsSchema>;

export type HomePageData = z.infer<typeof getHomePageResponseSchema>;

export type ProgramsPageData = z.infer<typeof getProgramsPageResponseSchema>;

export type AboutPageData = z.infer<typeof getAboutPageResponseSchema>;

export type BlogPageData = z.infer<typeof getBlogPageResponseSchema>;

export type ContactPageData = z.infer<typeof getContactPageResponseSchema>;
