import { type z } from "zod";

import { type schemeTemplateSchema } from "./scheme-template.schema";

export type SchemeTemplate = z.infer<typeof schemeTemplateSchema>;
