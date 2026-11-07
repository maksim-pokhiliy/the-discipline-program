import { z } from "zod";

import { DEFAULT_LOCALE_CODE } from "./locale.constants";
import {
  createLocaleSchema,
  localeCodeSchema,
  localeSchema,
  publicLocaleSchema,
  reorderLocalesSchema,
  updateLocaleSchema,
} from "./locale.schema";

export const localeCodeParamsSchema = z.object({ code: localeCodeSchema });

export const localeQuerySchema = z.object({
  locale: localeCodeSchema.default(DEFAULT_LOCALE_CODE),
});

export const adminLocaleListItemSchema = localeSchema.extend({
  translatedSectionCount: z.number().int().nonnegative(),
});

export const getLocalesResponseSchema = z.array(adminLocaleListItemSchema);

export const createLocaleRequestSchema = createLocaleSchema;

export const updateLocaleRequestSchema = updateLocaleSchema;

export const reorderLocalesRequestSchema = reorderLocalesSchema;

export const reorderLocalesResponseSchema = getLocalesResponseSchema;

export const getPublicLocalesResponseSchema = z.array(publicLocaleSchema);
