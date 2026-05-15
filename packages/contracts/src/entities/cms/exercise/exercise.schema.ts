import { z } from "zod";

import {
  EXERCISE_CANONICAL_COMPOUND_TYPE,
  EXERCISE_CONSTANTS,
  EXERCISE_EQUIPMENT,
  EXERCISE_MOVEMENT_TYPE,
} from "./exercise.constants";

export const exerciseEquipmentSchema = z.enum(EXERCISE_EQUIPMENT);
export const exerciseMovementTypeSchema = z.enum(EXERCISE_MOVEMENT_TYPE);
export const exerciseCanonicalCompoundTypeSchema = z.enum(EXERCISE_CANONICAL_COMPOUND_TYPE);

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
  primaryEquipment: exerciseEquipmentSchema,
  movementTypeTagPrimary: exerciseMovementTypeSchema,
  movementTypeTagSecondary: exerciseMovementTypeSchema.nullable(),
  canonicalCompoundType: exerciseCanonicalCompoundTypeSchema,
  placeholderFlag: z.boolean(),
  movementFamily: z.string().min(1).max(EXERCISE_CONSTANTS.MAX_MOVEMENT_FAMILY_LENGTH).nullable(),
  defaultDemoUrls: z.array(z.string().url()),
  aliases: z.array(z.string().min(1)),
  notes: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const exerciseFormBase = z.object({
  canonicalName: normalizedString(EXERCISE_CONSTANTS.MAX_CANONICAL_NAME_LENGTH),
  primaryEquipment: exerciseEquipmentSchema,
  movementTypeTagPrimary: exerciseMovementTypeSchema,
  movementTypeTagSecondary: exerciseMovementTypeSchema.nullable().optional(),
  canonicalCompoundType: exerciseCanonicalCompoundTypeSchema.default("ATOMIC"),
  placeholderFlag: z.boolean().default(false),
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

type PlaceholderShape = {
  placeholderFlag?: boolean | undefined;
  canonicalCompoundType?:
    | "ATOMIC"
    | "COMPOUND_PLUS"
    | "COMPOSITE_NAMED"
    | "PLACEHOLDER"
    | "ALTERNATIVE_OR"
    | undefined;
};

const placeholderConsistency = (data: PlaceholderShape): boolean => {
  if (data.placeholderFlag === undefined || data.canonicalCompoundType === undefined) {
    return true;
  }

  return data.placeholderFlag === (data.canonicalCompoundType === "PLACEHOLDER");
};

const placeholderRefineError = {
  message: "placeholderFlag must match canonicalCompoundType === 'PLACEHOLDER'",
  path: ["placeholderFlag"],
};

export const createExerciseSchema = exerciseFormBase.refine(
  placeholderConsistency,
  placeholderRefineError,
);

export const updateExerciseSchema = exerciseFormBase
  .partial()
  .refine(placeholderConsistency, placeholderRefineError);
