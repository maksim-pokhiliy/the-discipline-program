import { z } from "zod";

import { LOCALE_CONSTANTS } from "./locale.constants";

export const localeCodeSchema = z
  .string()
  .min(LOCALE_CONSTANTS.MIN_CODE_LENGTH)
  .max(LOCALE_CONSTANTS.MAX_CODE_LENGTH)
  .regex(LOCALE_CONSTANTS.CODE_PATTERN);

const localeNameSchema = z.string().trim().min(1).max(LOCALE_CONSTANTS.MAX_NAME_LENGTH);

const localeSortOrderSchema = z.number().int().nonnegative().max(LOCALE_CONSTANTS.MAX_SORT_ORDER);

export const localeSchema = z.object({
  code: localeCodeSchema,
  name: z.string().min(1),
  isEnabled: z.boolean(),
  isDefault: z.boolean(),
  sortOrder: z.number().int().nonnegative(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createLocaleSchema = z
  .object({
    code: localeCodeSchema,
    name: localeNameSchema,
  })
  .strict();

export const updateLocaleSchema = z
  .object({
    name: localeNameSchema,
    isEnabled: z.boolean(),
    sortOrder: localeSortOrderSchema,
  })
  .partial()
  .strict();

export const publicLocaleSchema = localeSchema.pick({ code: true, name: true });
