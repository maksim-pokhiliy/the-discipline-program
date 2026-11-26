import { z } from "zod";

import { localeCodeSchema, TranslationState } from "../locale";

import { PRODUCT_CONSTANTS } from "./product.constants";
import { adminProductSchema, productFeatureSchema } from "./product.schema";

export const productTranslationWordsSchema = z.object({
  title: z.string().max(PRODUCT_CONSTANTS.MAX_TITLE_LENGTH),
  description: z.string().max(PRODUCT_CONSTANTS.MAX_DESCRIPTION_LENGTH),
  features: z.array(productFeatureSchema),
});

export const productTranslationSchema = z.object({
  locale: localeCodeSchema,
  state: z.nativeEnum(TranslationState),
  words: productTranslationWordsSchema,
});

export const productLanguageStateSchema = z.object({
  locale: localeCodeSchema,
  name: z.string(),
  state: z.nativeEnum(TranslationState),
});

export const adminProductDetailsSchema = adminProductSchema.extend({
  translation: productTranslationSchema.nullable(),
});

export const adminProductListItemSchema = adminProductSchema.extend({
  translations: z.array(productLanguageStateSchema),
});
