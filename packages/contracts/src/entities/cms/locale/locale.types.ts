import { type z } from "zod";

import {
  type localeCodeSchema,
  type localeSchema,
  type createLocaleSchema,
  type updateLocaleSchema,
  type publicLocaleSchema,
} from "./locale.schema";

export type LocaleCode = z.infer<typeof localeCodeSchema>;

export type Locale = z.infer<typeof localeSchema>;

export type CreateLocaleData = z.infer<typeof createLocaleSchema>;

export type UpdateLocaleData = z.infer<typeof updateLocaleSchema>;

export type PublicLocale = z.infer<typeof publicLocaleSchema>;
