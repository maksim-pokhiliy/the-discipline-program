import type { NodeViewProps } from "@tiptap/react";

import { SchemeKind } from "@repo/contracts/library/scheme";

import type {
  BlockNodeAttrs,
  EmomSlotAttrs,
  ExerciseMentionAttrs,
  PrescriptionChipAttrs,
  SchemeMentionAttrs,
} from "../types";

export type BlockNodeViewProps = NodeViewProps;
export type EmomSlotNodeViewProps = NodeViewProps;
export type NotesNodeViewProps = NodeViewProps;
export type TextCalloutNodeViewProps = NodeViewProps;
export type ExerciseMentionNodeViewProps = NodeViewProps;
export type SchemeMentionNodeViewProps = NodeViewProps;
export type PrescriptionChipNodeViewProps = NodeViewProps;

const toRecord = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};

const readString = (value: unknown): string | null => (typeof value === "string" ? value : null);

const readNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const readBoolean = (value: unknown): boolean => (typeof value === "boolean" ? value : false);

const readNumberArray = (value: unknown): number[] =>
  Array.isArray(value) ? value.filter((n): n is number => typeof n === "number") : [];

const readStringRecord = (value: unknown): Record<string, number> => {
  const result: Record<string, number> = {};
  const record = toRecord(value);

  for (const [key, v] of Object.entries(record)) {
    if (typeof v === "number") {
      result[key] = v;
    }
  }

  return result;
};

const readSchemeKind = (value: unknown): SchemeKind | null => {
  if (typeof value !== "string") {
    return null;
  }

  const match = Object.values(SchemeKind).find((kind) => kind === value);

  return match ?? null;
};

export const readBlockAttrs = (attrs: Record<string, unknown>): BlockNodeAttrs => ({
  blockTypeId: readString(attrs.blockTypeId),
  schemeId: readString(attrs.schemeId),
  schemeKind: readSchemeKind(attrs.schemeKind),
  schemeConfig: readStringRecord(attrs.schemeConfig),
  effortPct: readNumber(attrs.effortPct),
  pace: readString(attrs.pace),
  note: readString(attrs.note),
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
  prescription:
    typeof attrs.prescription === "object" && attrs.prescription !== null
      ? toRecord(attrs.prescription)
      : null,
  restSec: readNumber(attrs.restSec),
  note: readString(attrs.note),
  complexGroup: readString(attrs.complexGroup),
  complexOrder: readNumber(attrs.complexOrder),
  sortOrder: readNumber(attrs.sortOrder) ?? 0,
  emomSlotId: readString(attrs.emomSlotId),
});

export const readSchemeMentionAttrs = (attrs: Record<string, unknown>): SchemeMentionAttrs => ({
  schemeId: readString(attrs.schemeId),
  schemeKind: readSchemeKind(attrs.schemeKind),
  schemeConfig: readStringRecord(attrs.schemeConfig),
  label: readString(attrs.label),
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

export const readTextCalloutAttrs = (attrs: Record<string, unknown>) => ({
  tone: readString(attrs.tone) ?? "info",
  note: readString(attrs.note),
  sortOrder: readNumber(attrs.sortOrder) ?? 0,
});

export { readBoolean };
