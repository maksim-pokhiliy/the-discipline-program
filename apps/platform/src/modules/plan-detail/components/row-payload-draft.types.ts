import type { FootnoteTarget, PlaceholderKind } from "@repo/contracts/lms/_shared";
import type { FootnoteMarker } from "@repo/contracts/lms/schema-row";

import type { CompoundRowDraft, ExerciseId } from "./exercise-form-draft.types";

export type FootnoteContentDraft = CompoundRowDraft;

export type FootnoteRowFormValue = {
  marker: FootnoteMarker;
  target: FootnoteTarget;
  content: FootnoteContentDraft;
  typeLabel?: string | undefined;
  notes: string;
};

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
  pairedConcreteRowId?: string | undefined;
};

export type PlaceholderRowFormValue = {
  placeholder: PlaceholderPayloadDraft;
  notes?: string | undefined;
};

export type RepDefinitionCompositionElementDraft = {
  exerciseId: ExerciseId;
  count: number;
};

export type RepDefinitionRowFormValue = {
  equality: {
    form: "inline_equality";
    totalReps: number;
    composition: RepDefinitionCompositionElementDraft[];
  };
  notes?: string | undefined;
};
