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

export type CyclicalCompoundCycleDraft = {
  primaryReps?: number | undefined;
  secondaryReps: number;
};

export type CyclicalCompoundDraft = {
  primaryExerciseId: ExerciseId;
  secondaryExerciseId: ExerciseId;
  cycles: CyclicalCompoundCycleDraft[];
  optionalRotationStepExerciseId?: string | undefined;
};

export type SandwichCompoundElementDraft = {
  exerciseId: ExerciseId;
  reps: RepNotation;
  load?: Load | undefined;
};

export type SandwichCompoundDraft = {
  opening: SandwichCompoundElementDraft;
  middle: SandwichCompoundElementDraft;
  closing: SandwichCompoundElementDraft;
  sharedModifiers?: { tempo?: TempoModifier | undefined; load?: Load | undefined } | undefined;
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
  | { form: "cyclical"; cyclical: CyclicalCompoundDraft }
  | { form: "sandwich"; sandwich: SandwichCompoundDraft }
  | { form: "or_alternative"; orAlternative: OrAlternativeDraft }
  | { form: "placeholder_ref"; placeholderExerciseId: ExerciseId };

export type CompoundFormDraft = Extract<ExerciseFormValue, { form: "compound" }>["compound"];
export type CyclicalFormDraft = Extract<ExerciseFormValue, { form: "cyclical" }>["cyclical"];
export type SandwichFormDraft = Extract<ExerciseFormValue, { form: "sandwich" }>["sandwich"];
export type OrAlternativeFormDraft = Extract<
  ExerciseFormValue,
  { form: "or_alternative" }
>["orAlternative"];
