import { type z } from "zod";

import { type blockTemplateSchema } from "./block-template.schema";

export type BlockTemplate = z.infer<typeof blockTemplateSchema>;
