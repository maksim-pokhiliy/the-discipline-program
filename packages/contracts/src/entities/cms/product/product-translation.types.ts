import { type z } from "zod";

import { type productTranslationWordsSchema } from "./product-translation.schema";

export type ProductTranslationWords = z.infer<typeof productTranslationWordsSchema>;
