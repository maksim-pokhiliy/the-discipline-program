import { type z } from "zod";

import type {
  CanonicalBlock,
  CanonicalDay,
  CanonicalRow,
  CanonicalSchemaNode,
  CanonicalSession,
  CanonicalWeek,
  ExerciseCatalogEntry,
  LabelCatalogEntry,
} from "../canonical-schema";
import { type phase7SessionSchema } from "../canonical-schema";

export type Phase7Session = z.infer<typeof phase7SessionSchema>;

export type ExerciseInput = ExerciseCatalogEntry;
export type LabelInput = LabelCatalogEntry;
export type WeekInput = CanonicalWeek;
export type DayInput = CanonicalDay;
export type SessionInput = CanonicalSession;
export type BlockInput = CanonicalBlock;
export type SchemaNodeInput = CanonicalSchemaNode;
export type RowInput = CanonicalRow;
export type Phase7SessionInput = Phase7Session;

const requireNonEmpty = (value: string, field: string, where: string): void => {
  if (value.length === 0) {
    throw new Error(`${where}: ${field} must be a non-empty string`);
  }
};

const requirePositiveInt = (value: number, field: string, where: string): void => {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${where}: ${field} must be a positive integer (got ${value})`);
  }
};

export const exercise = (input: ExerciseInput): ExerciseCatalogEntry => {
  requireNonEmpty(input.ref, "ref", "exercise");
  requireNonEmpty(input.canonicalName, "canonicalName", "exercise");

  return input;
};

export const label = (input: LabelInput): LabelCatalogEntry => {
  requireNonEmpty(input.ref, "ref", "label");
  requireNonEmpty(input.name, "name", "label");

  if (input.applicableLevels.length === 0) {
    throw new Error(
      'label: applicableLevels must contain at least one level (ref="' + input.ref + '")',
    );
  }

  return input;
};

export const row = (input: RowInput): CanonicalRow => {
  requirePositiveInt(input.order, "order", "row");

  return input;
};

export const schemaNode = (input: SchemaNodeInput): CanonicalSchemaNode => {
  requirePositiveInt(input.order, "order", "schemaNode");

  return input;
};

export const block = (input: BlockInput): CanonicalBlock => {
  requireNonEmpty(input.blockInstanceRef, "blockInstanceRef", "block");
  requirePositiveInt(input.order, "order", "block");

  return input;
};

export const session = (input: SessionInput): CanonicalSession => {
  requirePositiveInt(input.order, "order", "session");

  return input;
};

export const day = (input: DayInput): CanonicalDay => {
  requireNonEmpty(input.dayOfWeek, "dayOfWeek", "day");

  return input;
};

export const week = (input: WeekInput): CanonicalWeek => {
  requirePositiveInt(input.weekIndex, "weekIndex", "week");

  return input;
};

export const phase7Session = (input: Phase7SessionInput): Phase7Session => {
  requirePositiveInt(input.order, "order", "phase7Session");
  requireNonEmpty(input.exampleId, "exampleId", "phase7Session");
  requireNonEmpty(input.dayOfWeek, "dayOfWeek", "phase7Session");

  return input;
};
