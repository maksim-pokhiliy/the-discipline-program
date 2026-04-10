import { type z } from "zod";

import type { SECTION_SCHEMAS } from "./pages-api.schema";
import type { homePageWhyChooseSchema } from "./pages.schema";

export type HomePageWhyChooseData = z.infer<typeof homePageWhyChooseSchema>;
export type SectionSchemaKey = keyof typeof SECTION_SCHEMAS;
