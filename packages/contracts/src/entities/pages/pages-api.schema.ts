import { z } from "zod";
import { PAGE_SLUGS } from "./pages.constants";

export const getPageBySlugParamsSchema = z.object({
  pageSlug: z.enum(PAGE_SLUGS),
});
