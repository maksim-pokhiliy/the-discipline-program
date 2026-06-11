import type {
  Load,
  OrAlternativePurpose,
  PerLimbDistribution,
  RepNotation,
  TempoModifier,
} from "@repo/contracts/lms/_shared";

export type ExerciseId = string | null;

export type CompoundRowElementDraft = {
  exerciseId: ExerciseId;
  reps: RepNotation;
  load?: Load | undefined;
  side?: PerLimbDistribution | undefined;
};

export type CompoundRowDraft = {
  elements: CompoundRowElementDraft[];
  sharedModifiers?: { load?: Load | undefined; tempo?: TempoModifier | undefined } | undefined;
};

export type OrAlternativeDraft = {
  primaryExerciseId: ExerciseId;
  primaryReps: RepNotation;
  alternativeExerciseId: ExerciseId;
  alternativeReps: RepNotation;
  purpose: OrAlternativePurpose;
};

export type ExerciseFormValue =
  | { form: "atomic"; exerciseId: ExerciseId }
  | { form: "compound"; compound: CompoundRowDraft }
  | { form: "or_alternative"; orAlternative: OrAlternativeDraft }
  | { form: "placeholder_ref"; placeholderExerciseId: ExerciseId };

export type CompoundFormDraft = Extract<ExerciseFormValue, { form: "compound" }>["compound"];
export type OrAlternativeFormDraft = Extract<
  ExerciseFormValue,
  { form: "or_alternative" }
>["orAlternative"];
