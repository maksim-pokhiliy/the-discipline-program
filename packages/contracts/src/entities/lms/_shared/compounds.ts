import { z } from "zod";

import { orAlternativePurposeSchema, placeholderKindSchema } from "./enums";
import { loadSchema } from "./load";
import { repNotationSchema } from "./reps";
import { perLimbDistributionSchema } from "./side";
import { tempoModifierSchema } from "./tempo";

export const EXERCISE_FORMS = ["atomic", "compound", "or_alternative", "placeholder_ref"] as const;

export const compoundRowElementSchema = z.object({
  exerciseId: z.string().cuid(),
  reps: repNotationSchema,
  load: loadSchema.optional(),
  side: perLimbDistributionSchema.optional(),
});

export const compoundRowSchema = z.object({
  elements: z.array(compoundRowElementSchema).min(2),
  sharedModifiers: z
    .object({
      load: loadSchema.optional(),
      tempo: tempoModifierSchema.optional(),
    })
    .optional(),
});

export const orAlternativeSchema = z.object({
  primaryExerciseId: z.string().cuid(),
  primaryReps: repNotationSchema,
  alternativeExerciseId: z.string().cuid(),
  alternativeReps: repNotationSchema,
  purpose: orAlternativePurposeSchema,
});

export const perSetSubstitutionAssignmentSchema = z
  .object({
    setIndex: z.number().int().positive(),
    exerciseId: z.string().cuid().optional(),
    inlineCompound: compoundRowSchema.optional(),
  })
  .refine((a) => (a.exerciseId !== undefined) !== (a.inlineCompound !== undefined), {
    message: "perSetSubstitutionAssignment requires exactly one of exerciseId or inlineCompound",
  });

export const perSetSubstitutionSchema = z.object({
  placeholderName: z.string().min(1),
  assignments: z.array(perSetSubstitutionAssignmentSchema).min(1),
});

export const placeholderPayloadSchema = z.object({
  placeholderKind: placeholderKindSchema,
  text: z.string().min(1),
  perSetAssignments: perSetSubstitutionSchema.optional(),
});

export const exerciseFormSchema = z.discriminatedUnion("form", [
  z.object({ form: z.literal("atomic"), exerciseId: z.string().cuid() }),
  z.object({ form: z.literal("compound"), compound: compoundRowSchema }),
  z.object({ form: z.literal("or_alternative"), orAlternative: orAlternativeSchema }),
  z.object({
    form: z.literal("placeholder_ref"),
    placeholderExerciseId: z.string().cuid(),
  }),
]);

export type ExerciseForm = z.infer<typeof exerciseFormSchema>;
export type ExerciseFormKind = (typeof EXERCISE_FORMS)[number];
export type CompoundRow = z.infer<typeof compoundRowSchema>;
export type CompoundRowElement = z.infer<typeof compoundRowElementSchema>;
export type OrAlternative = z.infer<typeof orAlternativeSchema>;
export type PlaceholderPayload = z.infer<typeof placeholderPayloadSchema>;
export type PerSetSubstitution = z.infer<typeof perSetSubstitutionSchema>;
export type PerSetSubstitutionAssignment = z.infer<typeof perSetSubstitutionAssignmentSchema>;
