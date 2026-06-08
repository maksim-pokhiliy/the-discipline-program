import type { StagedProgramKind } from "@repo/contracts/lms/_shared";
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
  ParallelTrackDraft,
  RepetitionAxis,
  RestAxis,
  SupersetPairDraft,
} from "../components/axes/axis-draft.types";

import { asNodeId } from "./axis-draft-id";

export type InverseRefusalReason = {
  kind: "unrepresentable-repetition";
  schemaId: string;
  repetitionKind: string;
};

export type InverseResult =
  | { ok: true; container: ComposeContainer }
  | { ok: false; reason: InverseRefusalReason };

type RepetitionResult = { ok: true; value: RepetitionAxis } | { ok: false; repetitionKind: string };

type ContainerResult =
  | { ok: true; value: ComposeContainer }
  | { ok: false; reason: InverseRefusalReason };

const repetitionFromComposition = (repetition: ContractRepetitionAxis): RepetitionResult => {
  switch (repetition.kind) {
    case "once":
      return { ok: true, value: { kind: "once" } };
    case "count":
      return { ok: true, value: { kind: "count", count: repetition.count } };
    case "range":
      return { ok: false, repetitionKind: "range" };
    case "ladder":
      return { ok: true, value: { kind: "ladder", steps: repetition.steps } };
    case "timeCap":
      return { ok: true, value: { kind: "timeCap", cap: repetition.cap } };
    case "cadence":
      return {
        ok: true,
        value: {
          kind: "cadence",
          everyMin: repetition.everyMin,
          rounds: repetition.rounds,
          ...(repetition.totalMin !== undefined && { totalMin: repetition.totalMin }),
        },
      };
    case "window":
      return {
        ok: true,
        value: { kind: "window", startHhMm: repetition.startHhMm, endHhMm: repetition.endHhMm },
      };
    case "interval":
      return {
        ok: true,
        value: {
          kind: "interval",
          workMin: repetition.workMin,
          offMin: repetition.offMin,
          count: repetition.count,
        },
      };
    default:
      return repetition satisfies never;
  }
};

const trackFromComposition = (
  track: Extract<ContractArrangementAxis, { kind: "parallel" }>["tracks"][number],
): ParallelTrackDraft => ({
  childSchemaId: asNodeId(track.childSchemaId),
  ...(track.setEnumeration !== undefined && { setEnumeration: track.setEnumeration }),
  ...(track.pairedWithRowId !== undefined && { pairedWithRowId: asNodeId(track.pairedWithRowId) }),
});

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
    case "parallel":
      return {
        kind: "parallel",
        interleaveOrder: arrangement.interleaveOrder,
        tracks: arrangement.tracks.map(trackFromComposition),
      };
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
  programKind?: StagedProgramKind;
} => ({
  ...(composition.arrangement !== undefined && {
    arrangement: arrangementFromComposition(composition.arrangement),
  }),
  ...(composition.rest !== undefined && { rest: restFromComposition(composition.rest) }),
  ...(composition.programKind !== undefined && { programKind: composition.programKind }),
});

const containerFromSchemaWithBody = (node: SchemaWithBody): ContainerResult => {
  const composition = node.schema.composition ?? {};
  const { repetition } = composition;
  const repetitionResult =
    repetition === undefined ? undefined : repetitionFromComposition(repetition);

  if (repetitionResult !== undefined && !repetitionResult.ok) {
    return {
      ok: false,
      reason: {
        kind: "unrepresentable-repetition",
        schemaId: node.schema.id,
        repetitionKind: repetitionResult.repetitionKind,
      },
    };
  }

  const children: ComposeNode[] = node.rows.map(rowFromSchemaRow);

  for (const subSchema of node.subSchemas) {
    const childResult = containerFromSchemaWithBody(subSchema);

    if (!childResult.ok) {
      return childResult;
    }

    children.push(childResult.value);
  }

  return {
    ok: true,
    value: {
      nodeType: "container",
      id: asNodeId(node.schema.id),
      header: node.schema.header,
      notes: node.schema.notes,
      ...(repetitionResult !== undefined &&
        repetitionResult.ok && { repetition: repetitionResult.value }),
      ...splitAxes(composition),
      children,
    },
  };
};

export const schemaWithBodyToDraftContainer = (schema: SchemaWithBody): InverseResult => {
  const result = containerFromSchemaWithBody(schema);

  if (!result.ok) {
    return result;
  }

  return { ok: true, container: result.value };
};
