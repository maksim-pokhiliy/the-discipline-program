import { z } from "zod";

import { SchemeKind } from "../../library/scheme/scheme.constants";

import {
  PrescriptionKind,
  SchemeSectionKind,
  WORKOUT_BLOCK_CONSTANTS,
  WorkoutRepScheme,
} from "./workout-block.constants";

export const workoutRepSchemeSchema = z.nativeEnum(WorkoutRepScheme);

export const prescriptionKindSchema = z.nativeEnum(PrescriptionKind);

export const schemeKindSchema = z.nativeEnum(SchemeKind);

export const schemeSectionKindSchema = z.nativeEnum(SchemeSectionKind);

export const prescriptionSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal(PrescriptionKind.PERCENT_OF_1RM),
    value: z.number().min(0).max(200),
    ofExerciseId: z.string().cuid().nullable(),
  }),
  z.object({
    kind: z.literal(PrescriptionKind.KG),
    value: z.number().min(0),
  }),
  z.object({
    kind: z.literal(PrescriptionKind.RPE),
    value: z.number().min(1).max(10),
  }),
  z.object({
    kind: z.literal(PrescriptionKind.NONE),
  }),
]);

export const schemeConfigSchema = z.record(z.string(), z.number());

export const workoutBlockExerciseSchema = z
  .object({
    id: z.string().cuid(),
    sectionId: z.string().cuid().nullable(),
    emomSlotId: z.string().cuid().nullable(),
    exerciseId: z.string().cuid(),
    repScheme: workoutRepSchemeSchema,
    repValues: z.array(z.number().int().nonnegative()).max(WORKOUT_BLOCK_CONSTANTS.MAX_REP_VALUES),
    sets: z.number().int().positive().nullable(),
    prescription: prescriptionSchema.nullable(),
    restSec: z.number().int().nonnegative().nullable(),
    note: z.string().max(WORKOUT_BLOCK_CONSTANTS.MAX_NOTE_LENGTH).nullable(),
    complexGroup: z.string().max(WORKOUT_BLOCK_CONSTANTS.MAX_COMPLEX_GROUP_LENGTH).nullable(),
    complexOrder: z.number().int().nonnegative().nullable(),
    sortOrder: z.number().int().nonnegative(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .refine((v) => (v.sectionId === null) !== (v.emomSlotId === null), {
    message: "Exactly one of sectionId or emomSlotId must be set",
    path: ["sectionId"],
  });

export const emomSlotSchema = z.object({
  id: z.string().cuid(),
  sectionId: z.string().cuid(),
  minuteInRound: z.number().int().nonnegative(),
  sortOrder: z.number().int().nonnegative(),
  note: z.string().max(WORKOUT_BLOCK_CONSTANTS.MAX_NOTE_LENGTH).nullable(),
  exercises: z.array(workoutBlockExerciseSchema).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const schemeSectionSchema = z.object({
  id: z.string().cuid(),
  blockId: z.string().cuid(),
  kind: schemeSectionKindSchema,
  schemeId: z.string().cuid().nullable(),
  schemeKind: schemeKindSchema.nullable(),
  schemeConfig: schemeConfigSchema.nullable(),
  effortPct: z
    .number()
    .int()
    .min(WORKOUT_BLOCK_CONSTANTS.MIN_EFFORT_PCT)
    .max(WORKOUT_BLOCK_CONSTANTS.MAX_EFFORT_PCT)
    .nullable(),
  pace: z.string().max(WORKOUT_BLOCK_CONSTANTS.MAX_PACE_LENGTH).nullable(),
  note: z.string().max(WORKOUT_BLOCK_CONSTANTS.MAX_NOTE_LENGTH).nullable(),
  tone: z.string().max(32).nullable(),
  sortOrder: z.number().int().nonnegative(),
  exercises: z.array(workoutBlockExerciseSchema).optional(),
  emomSlots: z.array(emomSlotSchema).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const workoutBlockSchema = z.object({
  id: z.string().cuid(),
  workoutId: z.string().cuid(),
  blockTypeId: z.string().cuid(),
  title: z.string().max(120).nullable(),
  sortOrder: z.number().int().nonnegative(),
  sections: z.array(schemeSectionSchema).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createWorkoutBlockExerciseSchema = workoutBlockExerciseSchema;

export const createEmomSlotSchema = emomSlotSchema;

export const createSchemeSectionSchema = schemeSectionSchema;

export const createWorkoutBlockSchema = workoutBlockSchema;
