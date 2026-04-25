import { z } from "zod";

import {
  prescriptionSchema,
  schemeConfigSchema,
  schemeKindSchema,
  WORKOUT_BLOCK_CONSTANTS,
  WorkoutRepScheme,
} from "@repo/contracts/lms/workout-block";

export const BLOCK_WRAPPER_NODE_TYPE = "block" as const;

export const SCHEME_SECTION_NODE_TYPE = "schemeSection" as const;

export const NOTES_SECTION_NODE_TYPE = "notesSection" as const;

export const TEXT_CALLOUT_SECTION_NODE_TYPE = "textCalloutSection" as const;

export const EXERCISE_LINE_NODE_TYPE = "exerciseLine" as const;

export const EMOM_SLOT_NODE_TYPE = "emomSlot" as const;

export const EXERCISE_MENTION_NODE_TYPE = "exerciseMention" as const;

export const SECTION_NODE_TYPES = [
  SCHEME_SECTION_NODE_TYPE,
  NOTES_SECTION_NODE_TYPE,
  TEXT_CALLOUT_SECTION_NODE_TYPE,
] as const;

const MAX_TITLE_LENGTH = 120;

const MAX_TONE_LENGTH = 32;

export const blockWrapperAttrsSchema = z.object({
  blockTypeId: z.string().cuid(),
  title: z.string().max(MAX_TITLE_LENGTH).nullable().optional(),
  sortOrder: z.number().int().nonnegative().optional(),
});

export const schemeSectionAttrsSchema = z.object({
  schemeId: z.string().cuid().nullable().optional(),
  schemeKind: schemeKindSchema.nullable().optional(),
  schemeConfig: schemeConfigSchema.nullable().optional(),
  effortPct: z
    .number()
    .int()
    .min(WORKOUT_BLOCK_CONSTANTS.MIN_EFFORT_PCT)
    .max(WORKOUT_BLOCK_CONSTANTS.MAX_EFFORT_PCT)
    .nullable()
    .optional(),
  pace: z.string().max(WORKOUT_BLOCK_CONSTANTS.MAX_PACE_LENGTH).nullable().optional(),
  note: z.string().max(WORKOUT_BLOCK_CONSTANTS.MAX_NOTE_LENGTH).nullable().optional(),
  sortOrder: z.number().int().nonnegative().optional(),
});

export const notesSectionAttrsSchema = z.object({
  note: z.string().max(WORKOUT_BLOCK_CONSTANTS.MAX_NOTE_LENGTH).nullable().optional(),
  sortOrder: z.number().int().nonnegative().optional(),
});

export const textCalloutSectionAttrsSchema = z.object({
  tone: z.string().max(MAX_TONE_LENGTH).optional(),
  note: z.string().max(WORKOUT_BLOCK_CONSTANTS.MAX_NOTE_LENGTH).nullable().optional(),
  sortOrder: z.number().int().nonnegative().optional(),
});

export const exerciseLineAttrsSchema = z.object({
  sortOrder: z.number().int().nonnegative().optional(),
});

export const exerciseMentionAttrsSchema = z.object({
  exerciseId: z.string().min(1),
  repScheme: z.nativeEnum(WorkoutRepScheme).optional(),
  repValues: z.array(z.number().int().nonnegative()).optional(),
  sets: z.number().int().positive().optional().nullable(),
  prescription: prescriptionSchema.optional().nullable(),
  restSec: z.number().int().nonnegative().optional().nullable(),
  note: z.string().optional().nullable(),
  complexGroup: z.string().optional().nullable(),
  complexOrder: z.number().int().nonnegative().optional().nullable(),
});

export const emomSlotAttrsSchema = z.object({
  minuteInRound: z.number().int().nonnegative(),
  note: z.string().optional().nullable(),
});

export const toNodePath = (...segments: (string | number)[]): string => segments.join(".");
