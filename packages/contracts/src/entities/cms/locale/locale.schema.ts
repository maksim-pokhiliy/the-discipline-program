import { z } from "zod";

import { DEFAULT_LOCALE_CODE, LOCALE_CONSTANTS, RESERVED_LOCALE_CODES } from "./locale.constants";

const LOCALE_CODE_RULE_MESSAGE = "Use two or three lowercase letters";

export const localeCodeSchema = z
  .string()
  .min(LOCALE_CONSTANTS.MIN_CODE_LENGTH, LOCALE_CODE_RULE_MESSAGE)
  .max(LOCALE_CONSTANTS.MAX_CODE_LENGTH, LOCALE_CODE_RULE_MESSAGE)
  .regex(LOCALE_CONSTANTS.CODE_PATTERN, LOCALE_CODE_RULE_MESSAGE)
  .refine(
    (code) => !RESERVED_LOCALE_CODES.includes(code),
    (code) => ({ message: `The locale code "${code}" is reserved by a path of the site` }),
  );

const localeNameSchema = z.string().trim().min(1).max(LOCALE_CONSTANTS.MAX_NAME_LENGTH);

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
  })
  .partial()
  .strict();

export const reorderLocalesSchema = z
  .object({
    orderedCodes: z
      .array(localeCodeSchema)
      .min(1)
      .refine((codes) => new Set(codes).size === codes.length, {
        message: "orderedCodes must be unique",
      })
      .refine((codes) => !codes.includes(DEFAULT_LOCALE_CODE), {
        message: "orderedCodes must not include the default locale",
      }),
  })
  .strict();

export const publicLocaleSchema = localeSchema.pick({ code: true, name: true });
