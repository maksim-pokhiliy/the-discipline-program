import { z } from "zod";

import { APP_LEVELS, type AppLevelValue, LABEL_CONSTANTS } from "./label.constants";

const ZERO_WIDTH_RE = /\u200B|\u200C|\u200D|\uFEFF|\u2060/g;

const normalizeText = (raw: string): string => raw.normalize("NFKC").replace(ZERO_WIDTH_RE, "");

const normalizedString = (max: number) =>
  z.string().transform(normalizeText).pipe(z.string().trim().min(1).max(max));

export const appLevelSchema = z.enum(APP_LEVELS);

const applicableLevelsSchema = z
  .array(appLevelSchema)
  .min(1)
  .max(3)
  .refine((levels) => new Set(levels).size === levels.length, {
    message: "Applicable levels must be unique",
  });

const isDayOnly = (levels: readonly AppLevelValue[]): boolean =>
  levels.length === 1 && levels[0] === "DAY";

export const REST_MUTEX_MESSAGE = "Rest label must apply only to DAY level";

export const restMutexBothPresent = (data: {
  rest?: boolean | undefined;
  applicableLevels?: readonly AppLevelValue[] | undefined;
}): boolean => {
  if (data.rest !== true || data.applicableLevels === undefined) {
    return true;
  }

  return isDayOnly(data.applicableLevels);
};

const restMutexRefineError = {
  message: REST_MUTEX_MESSAGE,
  path: ["rest"],
};

export const labelSchema = z
  .object({
    id: z.string().cuid(),
    name: z.string().min(1).max(LABEL_CONSTANTS.MAX_NAME_LENGTH),
    nameLower: z.string(),
    applicableLevels: applicableLevelsSchema,
    notes: z.string().nullable(),
    rest: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .refine(restMutexBothPresent, restMutexRefineError);

const labelFormBase = z.object({
  name: normalizedString(LABEL_CONSTANTS.MAX_NAME_LENGTH),
  applicableLevels: applicableLevelsSchema,
  notes: z.string().max(LABEL_CONSTANTS.MAX_NOTES_LENGTH).nullable().optional(),
  rest: z.boolean().optional().default(false),
});

export const createLabelSchema = labelFormBase.refine(restMutexBothPresent, restMutexRefineError);

export const updateLabelSchema = labelFormBase
  .partial()
  .refine(restMutexBothPresent, restMutexRefineError);
