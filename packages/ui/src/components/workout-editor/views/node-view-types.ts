import type { NodeViewProps } from "@tiptap/react";

import { SchemeKind } from "@repo/contracts/library/scheme";

import { type BlockWrapperAttrs } from "../nodes/block-wrapper-node";
import { type ExerciseLineAttrs } from "../nodes/exercise-line-node";
import { type NotesSectionAttrs } from "../nodes/notes-section-node";
import { type SchemeSectionAttrs } from "../nodes/scheme-section-node";
import { type TextCalloutSectionAttrs } from "../nodes/text-callout-section-node";
import type { EmomSlotAttrs, ExerciseMentionAttrs, PrescriptionChipAttrs } from "../types";

export type BlockNodeViewProps = NodeViewProps;
export type SchemeSectionNodeViewProps = NodeViewProps;
export type NotesSectionNodeViewProps = NodeViewProps;
export type TextCalloutSectionNodeViewProps = NodeViewProps;
export type ExerciseLineNodeViewProps = NodeViewProps;
export type EmomSlotNodeViewProps = NodeViewProps;
export type ExerciseMentionNodeViewProps = NodeViewProps;
export type PrescriptionChipNodeViewProps = NodeViewProps;

const readString = (value: unknown): string | null => (typeof value === "string" ? value : null);

const readNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const readBoolean = (value: unknown): boolean => (typeof value === "boolean" ? value : false);

const readNumberArray = (value: unknown): number[] =>
  Array.isArray(value) ? value.filter((n): n is number => typeof n === "number") : [];

const readSchemeKind = (value: unknown): SchemeKind | null => {
  if (typeof value !== "string") {
    return null;
  }

  for (const kind of Object.values(SchemeKind)) {
    if (kind === value) {
      return kind;
    }
  }

  return null;
};

const readSchemeConfig = (value: unknown): Record<string, number> => {
  if (value === null || typeof value !== "object") {
    return {};
  }

  const result: Record<string, number> = {};

  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === "number" && Number.isFinite(entry)) {
      result[key] = entry;
    }
  }

  return result;
};

const readPrescriptionRecord = (value: unknown): Record<string, unknown> | null => {
  if (value === null || typeof value !== "object") {
    return null;
  }

  const result: Record<string, unknown> = {};

  for (const [key, entry] of Object.entries(value)) {
    result[key] = entry;
  }

  return result;
};

export const readBlockWrapperAttrs = (attrs: Record<string, unknown>): BlockWrapperAttrs => ({
  blockTypeId: readString(attrs.blockTypeId),
  title: readString(attrs.title),
  sortOrder: readNumber(attrs.sortOrder) ?? 0,
});

export const readSchemeSectionAttrs = (attrs: Record<string, unknown>): SchemeSectionAttrs => ({
  schemeId: readString(attrs.schemeId),
  schemeKind: readSchemeKind(attrs.schemeKind),
  schemeConfig: readSchemeConfig(attrs.schemeConfig),
  effortPct: readNumber(attrs.effortPct),
  pace: readString(attrs.pace),
  note: readString(attrs.note),
  sortOrder: readNumber(attrs.sortOrder) ?? 0,
});

export const readNotesSectionAttrs = (attrs: Record<string, unknown>): NotesSectionAttrs => ({
  note: readString(attrs.note),
  sortOrder: readNumber(attrs.sortOrder) ?? 0,
});

export const readTextCalloutSectionAttrs = (
  attrs: Record<string, unknown>,
): TextCalloutSectionAttrs => ({
  tone: readString(attrs.tone) ?? "info",
  note: readString(attrs.note),
  sortOrder: readNumber(attrs.sortOrder) ?? 0,
});

export const readExerciseLineAttrs = (attrs: Record<string, unknown>): ExerciseLineAttrs => ({
  sortOrder: readNumber(attrs.sortOrder) ?? 0,
});

export const readEmomSlotAttrs = (attrs: Record<string, unknown>): EmomSlotAttrs => ({
  minuteInRound: readNumber(attrs.minuteInRound) ?? 0,
  note: readString(attrs.note),
  sortOrder: readNumber(attrs.sortOrder) ?? 0,
});

export const readExerciseMentionAttrs = (attrs: Record<string, unknown>): ExerciseMentionAttrs => ({
  exerciseId: readString(attrs.exerciseId),
  canonicalName: readString(attrs.canonicalName),
  repScheme: readString(attrs.repScheme),
  repValues: readNumberArray(attrs.repValues),
  sets: readNumber(attrs.sets),
  prescription: readPrescriptionRecord(attrs.prescription),
  restSec: readNumber(attrs.restSec),
  note: readString(attrs.note),
  complexGroup: readString(attrs.complexGroup),
  complexOrder: readNumber(attrs.complexOrder),
  sortOrder: readNumber(attrs.sortOrder) ?? 0,
  emomSlotId: readString(attrs.emomSlotId),
});

export const readPrescriptionChipAttrs = (
  attrs: Record<string, unknown>,
): PrescriptionChipAttrs => ({
  kind: readString(attrs.kind) ?? "PERCENT_OF_1RM",
  value: readNumber(attrs.value),
  unit: readString(attrs.unit),
  ofExerciseId: readString(attrs.ofExerciseId),
  label: readString(attrs.label),
});

export { readBoolean };
