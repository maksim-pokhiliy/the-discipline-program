import type { CompoundRepDefinition, MediaReference } from "@repo/contracts/lms/_shared";

export type MediaPosition = "inline" | "standalone_row" | "bare";
export type MediaAppliesTo = "previous_row" | "current_row" | "whole_schema" | "drop_stage";

export type MediaInput = {
  url: string;
  position: MediaPosition;
  appliesTo: MediaAppliesTo;
  label?: string;
};

export const mediaReference = (input: MediaInput): MediaReference =>
  input.label === undefined
    ? { url: input.url, position: input.position, appliesTo: input.appliesTo }
    : { url: input.url, position: input.position, appliesTo: input.appliesTo, label: input.label };

export type CompoundRepCompositionInput = { exerciseId: string; count: number };

export const inlineEqualityCompoundRep = (
  totalReps: number,
  composition: readonly CompoundRepCompositionInput[],
): CompoundRepDefinition => {
  if (composition.length === 0) {
    throw new Error("inlineEqualityCompoundRep: composition must be non-empty");
  }

  return { form: "inline_equality", totalReps, composition: [...composition] };
};

export const curlyBraceCompoundRep = (
  composition: readonly CompoundRepCompositionInput[],
): CompoundRepDefinition => {
  if (composition.length === 0) {
    throw new Error("curlyBraceCompoundRep: composition must be non-empty");
  }

  return { form: "curly_brace", composition: [...composition] };
};
