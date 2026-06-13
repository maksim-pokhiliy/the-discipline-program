import type {
  RepetitionAxis as ContractRepetitionAxis,
  RestAxis as ContractRestAxis,
} from "@repo/contracts/lms/composition";
import type { SchemaWithBody } from "@repo/contracts/lms/schema";
import type { SchemaRow } from "@repo/contracts/lms/schema-row";

import type {
  ComposeRow,
  RepetitionAxis,
  RestAxis,
  SchemaDraft,
} from "../components/axes/axis-draft.types";

import { asNodeId } from "./axis-draft-id";

const repetitionFromComposition = (repetition: ContractRepetitionAxis): RepetitionAxis => {
  switch (repetition.kind) {
    case "once":
      return { kind: "once" };
    case "count":
      return { kind: "count", count: repetition.count };
    case "ladder":
      return { kind: "ladder", steps: repetition.steps };
    case "timeCap":
      return { kind: "timeCap", cap: repetition.cap };
    case "cadence":
      return { kind: "cadence", everyMin: repetition.everyMin, rounds: repetition.rounds };
    case "interval":
      return {
        kind: "interval",
        workMin: repetition.workMin,
        offMin: repetition.offMin,
        count: repetition.count,
      };
    default:
      return repetition satisfies never;
  }
};

const restFromComposition = (rest: ContractRestAxis): RestAxis => rest;

const rowFromSchemaRow = (row: SchemaRow): ComposeRow => ({
  nodeType: "row",
  id: asNodeId(row.id),
  exerciseId: row.exerciseId,
  sets: row.sets,
  rowGroupId: row.rowGroupId,
  reps: row.reps,
  load: row.load,
  side: row.side,
  tempo: row.tempo,
  modifiers: row.modifiers,
  notes: row.notes,
  editorDraft: undefined,
});

export const schemaWithBodyToDraft = (schema: SchemaWithBody): SchemaDraft => {
  const composition = schema.schema.composition ?? {};
  const { repetition, rest } = composition;

  return {
    id: asNodeId(schema.schema.id),
    header: schema.schema.header,
    notes: schema.schema.notes,
    ...(repetition !== undefined && { repetition: repetitionFromComposition(repetition) }),
    ...(rest !== undefined && { rest: restFromComposition(rest) }),
    rows: schema.rows.map(rowFromSchemaRow),
  };
};
