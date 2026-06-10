import type {
  ArrangementAxis as ContractArrangementAxis,
  Composition,
  RepetitionAxis as ContractRepetitionAxis,
  RestAxis as ContractRestAxis,
} from "@repo/contracts/lms/composition";
import type { SchemaWithBody } from "@repo/contracts/lms/schema";
import type { SchemaRow } from "@repo/contracts/lms/schema-row";

import type {
  ArrangementAxis,
  ComposeContainer,
  ComposeNode,
  ComposeRow,
  RepetitionAxis,
  RestAxis,
  SupersetPairDraft,
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

const pairFromComposition = (
  pair: Extract<ContractArrangementAxis, { kind: "superset" }>["pairs"][number],
): SupersetPairDraft => ({
  label: pair.label,
  rowIds: pair.rowIds.map(asNodeId),
});

const arrangementFromComposition = (arrangement: ContractArrangementAxis): ArrangementAxis => {
  switch (arrangement.kind) {
    case "ordered":
      return { kind: "ordered" };
    case "superset":
      return { kind: "superset", pairs: arrangement.pairs.map(pairFromComposition) };
    default:
      return arrangement satisfies never;
  }
};

const restFromComposition = (rest: ContractRestAxis): RestAxis => rest;

const rowFromSchemaRow = (row: SchemaRow): ComposeRow => ({
  nodeType: "row",
  id: asNodeId(row.id),
  rowKind: row.rowKind,
  rowPayload: row.rowPayload,
  reps: row.reps,
  load: row.load,
  side: row.side,
  tempo: row.tempo,
  position: row.position,
  intensity: row.intensity,
  notes: row.notes,
  editorDraft: undefined,
});

const splitAxes = (
  composition: Composition,
): {
  arrangement?: ArrangementAxis;
  rest?: RestAxis;
} => ({
  ...(composition.arrangement !== undefined && {
    arrangement: arrangementFromComposition(composition.arrangement),
  }),
  ...(composition.rest !== undefined && { rest: restFromComposition(composition.rest) }),
});

const containerFromSchemaWithBody = (node: SchemaWithBody): ComposeContainer => {
  const composition = node.schema.composition ?? {};
  const { repetition, interleaveOrder } = composition;

  const children: ComposeNode[] = node.rows.map(rowFromSchemaRow);

  for (const subSchema of node.subSchemas) {
    children.push(containerFromSchemaWithBody(subSchema));
  }

  return {
    nodeType: "container",
    id: asNodeId(node.schema.id),
    header: node.schema.header,
    notes: node.schema.notes,
    ...(repetition !== undefined && { repetition: repetitionFromComposition(repetition) }),
    ...(interleaveOrder !== undefined && { interleaveOrder }),
    ...splitAxes(composition),
    children,
  };
};

export const schemaWithBodyToDraftContainer = (schema: SchemaWithBody): ComposeContainer =>
  containerFromSchemaWithBody(schema);
