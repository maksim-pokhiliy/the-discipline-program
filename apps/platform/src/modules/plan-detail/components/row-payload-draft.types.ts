import type { PlaceholderKind } from "@repo/contracts/lms/_shared";

import type { ExerciseId } from "./exercise-form-draft.types";

export type PerSetSubstitutionAssignmentDraft = {
  setIndex: number;
  exerciseId: ExerciseId;
};

export type PerSetSubstitutionDraft = {
  placeholderName: string;
  assignments: PerSetSubstitutionAssignmentDraft[];
};

export type PlaceholderPayloadDraft = {
  placeholderKind: PlaceholderKind;
  text: string;
  perSetAssignments?: PerSetSubstitutionDraft | undefined;
};

export type PlaceholderRowFormValue = {
  placeholder: PlaceholderPayloadDraft;
  notes?: string | undefined;
};
