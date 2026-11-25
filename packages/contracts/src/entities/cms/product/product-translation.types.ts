import { type z } from "zod";

import {
  type adminProductDetailsSchema,
  type adminProductListItemSchema,
  type productLanguageStateSchema,
  type productTranslationSchema,
  type productTranslationWordsSchema,
} from "./product-translation.schema";

export type ProductTranslationWords = z.infer<typeof productTranslationWordsSchema>;
export type AdminProductTranslation = z.infer<typeof productTranslationSchema>;
export type ProductLanguageState = z.infer<typeof productLanguageStateSchema>;
export type AdminProductDetails = z.infer<typeof adminProductDetailsSchema>;
export type AdminProductListItem = z.infer<typeof adminProductListItemSchema>;
