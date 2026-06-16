import { z } from "zod";

import { EXERCISE_CONSTANTS, EXERCISE_NATURE } from "./exercise.constants";

export const exerciseNatureSchema = z.enum(EXERCISE_NATURE);

const ZERO_WIDTH_RE = /\u200B|\u200C|\u200D|\uFEFF|\u2060/g;

const normalizeText = (raw: string): string => raw.normalize("NFKC").replace(ZERO_WIDTH_RE, "");

const normalizedString = (max: number) =>
  z.string().transform(normalizeText).pipe(z.string().trim().min(1).max(max));

const httpUrlSchema = z
  .string()
  .url()
  .max(EXERCISE_CONSTANTS.MAX_URL_LENGTH)
  .refine(
    (raw) => {
      try {
        return ["http:", "https:"].includes(new URL(raw).protocol);
      } catch {
        return false;
      }
    },
    { message: "Only http(s) URLs are allowed" },
  );

export const exerciseSchema = z.object({
  id: z.string().cuid(),
  canonicalName: z.string().min(1).max(EXERCISE_CONSTANTS.MAX_CANONICAL_NAME_LENGTH),
  canonicalNameLower: z.string(),
  nature: exerciseNatureSchema,
  movementFamily: z.string().min(1).max(EXERCISE_CONSTANTS.MAX_MOVEMENT_FAMILY_LENGTH).nullable(),
  defaultDemoUrls: z.array(z.string().url()),
  aliases: z.array(z.string().min(1)),
  notes: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const exerciseFormBase = z.object({
  canonicalName: normalizedString(EXERCISE_CONSTANTS.MAX_CANONICAL_NAME_LENGTH),
  nature: exerciseNatureSchema.default("CONCRETE"),
  movementFamily: normalizedString(EXERCISE_CONSTANTS.MAX_MOVEMENT_FAMILY_LENGTH)
    .nullable()
    .optional(),
  defaultDemoUrls: z.array(httpUrlSchema).max(EXERCISE_CONSTANTS.MAX_ARRAY_LENGTH).default([]),
  aliases: z
    .array(normalizedString(EXERCISE_CONSTANTS.MAX_CANONICAL_NAME_LENGTH))
    .max(EXERCISE_CONSTANTS.MAX_ARRAY_LENGTH)
    .default([]),
  notes: z.string().max(EXERCISE_CONSTANTS.MAX_NOTES_LENGTH).nullable().optional(),
});

export const createExerciseSchema = exerciseFormBase;

export const updateExerciseSchema = exerciseFormBase.partial();
