import { z } from "zod";

import { DEFAULT_LOCALE_CODE } from "./locale.constants";
import {
  createLocaleSchema,
  localeCodeSchema,
  localeSchema,
  publicLocaleSchema,
  updateLocaleSchema,
} from "./locale.schema";

export const localeCodeParamsSchema = z.object({ code: localeCodeSchema });

export const localeQuerySchema = z.object({
  locale: localeCodeSchema.default(DEFAULT_LOCALE_CODE),
});

export const getLocalesResponseSchema = z.array(localeSchema);

export const createLocaleRequestSchema = createLocaleSchema;

export const updateLocaleRequestSchema = updateLocaleSchema;

export const getPublicLocalesResponseSchema = z.array(publicLocaleSchema);
