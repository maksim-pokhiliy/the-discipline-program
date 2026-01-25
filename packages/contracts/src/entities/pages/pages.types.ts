import { type z } from "zod";

import { type marketingPageSectionSchema, type pageListItemSchema } from "./pages-api.schema";

export type PageSectionDto = z.infer<typeof marketingPageSectionSchema>;
export type PageListItemDto = z.infer<typeof pageListItemSchema>;
