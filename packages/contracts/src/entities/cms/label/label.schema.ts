import { z } from "zod";

import { APP_LEVELS, LABEL_CONSTANTS } from "./label.constants";

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

export const labelSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).max(LABEL_CONSTANTS.MAX_NAME_LENGTH),
  nameLower: z.string(),
  applicableLevels: applicableLevelsSchema,
  notes: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const labelFormBase = z.object({
  name: normalizedString(LABEL_CONSTANTS.MAX_NAME_LENGTH),
  applicableLevels: applicableLevelsSchema,
  notes: z.string().max(LABEL_CONSTANTS.MAX_NOTES_LENGTH).nullable().optional(),
});

export const createLabelSchema = labelFormBase;

export const updateLabelSchema = labelFormBase.partial();
