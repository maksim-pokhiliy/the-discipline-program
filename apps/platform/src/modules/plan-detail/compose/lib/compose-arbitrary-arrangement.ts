import type { ParallelInterleaveOrder } from "@repo/contracts/lms/composition";

import type {
  ArrangementAxis,
  ComposeContainer,
  ComposeNode,
  ComposeRow,
  RepetitionAxis,
  RestAxis,
  ScoringDirective,
} from "../compose-tree.types";

import { collectDescendantRows } from "./arrangement-tree";
import { asNodeId } from "./id-factory";

const MIN_TRACKS = 2;
const MIN_PAIR_ROWS = 2;
const INTERLEAVE_ORDERS: ParallelInterleaveOrder[] = ["round_by_round", "track_by_track"];

export type RawArrangement = "none" | "ordered" | "parallel" | "superset";

export type RawInvalid =
  | "single-track"
  | "dangling-track"
  | "nonpositive-enumeration"
  | "grandchild-superset"
  | "single-row-pair";

export type RawRow = { kind: "row" };

export type RawContainer = {
  kind: "container";
  repetition: RepetitionAxis | null;
  scoring: ScoringDirective | null;
  rest: RestAxis | null;
  arrangement: RawArrangement;
  invalid: RawInvalid | null;
  children: RawNode[];
};

export type RawNode = RawRow | RawContainer;

const directContainers = (children: ComposeNode[]): ComposeContainer[] =>
  children.filter((child): child is ComposeContainer => child.nodeType === "container");

const directRows = (children: ComposeNode[]): ComposeRow[] =>
  children.filter((child): child is ComposeRow => child.nodeType === "row");

const firstDescendantRow = (container: ComposeContainer): ComposeRow | null =>
  collectDescendantRows(container)[0] ?? null;

const validParallel = (children: ComposeNode[]): ArrangementAxis | null => {
  const tracks = directContainers(children);

  if (tracks.length < MIN_TRACKS) {
    return null;
  }

  const siblingRow = firstDescendantRow(tracks[0] as ComposeContainer);

  return {
    kind: "parallel",
    interleaveOrder: INTERLEAVE_ORDERS[
      children.length % INTERLEAVE_ORDERS.length
    ] as ParallelInterleaveOrder,
    tracks: [
      {
        childSchemaId: (tracks[0] as ComposeContainer).id,
        setEnumeration: [children.length + 1, children.length + 2],
      },
      {
        childSchemaId: (tracks[1] as ComposeContainer).id,
        ...(siblingRow !== null && { pairedWithRowId: siblingRow.id }),
      },
      ...tracks.slice(MIN_TRACKS).map((track) => ({ childSchemaId: track.id })),
    ],
  };
};

const validSuperset = (children: ComposeNode[]): ArrangementAxis | null => {
  const rows = directRows(children);

  if (rows.length < MIN_PAIR_ROWS) {
    return null;
  }

  return {
    kind: "superset",
    pairs: [{ label: "generated pair", rowIds: rows.slice(0, MIN_PAIR_ROWS).map((row) => row.id) }],
  };
};

const invalidParallel = (children: ComposeNode[], defect: RawInvalid): ArrangementAxis | null => {
  const tracks = directContainers(children);

  if (defect === "grandchild-superset" || defect === "single-row-pair") {
    return null;
  }

  if (defect === "single-track") {
    if (tracks.length < 1) {
      return null;
    }

    return {
      kind: "parallel",
      interleaveOrder: "round_by_round",
      tracks: [{ childSchemaId: (tracks[0] as ComposeContainer).id }],
    };
  }

  if (tracks.length < MIN_TRACKS) {
    return null;
  }

  if (defect === "dangling-track") {
    return {
      kind: "parallel",
      interleaveOrder: "round_by_round",
      tracks: [
        { childSchemaId: (tracks[0] as ComposeContainer).id },
        { childSchemaId: asNodeId("gen-dangling-ref") },
      ],
    };
  }

  return {
    kind: "parallel",
    interleaveOrder: "round_by_round",
    tracks: [
      { childSchemaId: (tracks[0] as ComposeContainer).id, setEnumeration: [0] },
      { childSchemaId: (tracks[1] as ComposeContainer).id },
    ],
  };
};

const invalidSuperset = (children: ComposeNode[], defect: RawInvalid): ArrangementAxis | null => {
  if (defect !== "grandchild-superset" && defect !== "single-row-pair") {
    return null;
  }

  if (defect === "single-row-pair") {
    const rows = directRows(children);

    if (rows.length < 1) {
      return null;
    }

    return {
      kind: "superset",
      pairs: [{ label: "solo pair", rowIds: [(rows[0] as ComposeRow).id] }],
    };
  }

  const nestedRows = directContainers(children)
    .flatMap((container) => collectDescendantRows(container))
    .slice(0, MIN_PAIR_ROWS);

  if (nestedRows.length < MIN_PAIR_ROWS) {
    return null;
  }

  return {
    kind: "superset",
    pairs: [{ label: "grandchild pair", rowIds: nestedRows.map((row) => row.id) }],
  };
};

export const deriveArrangement = (
  raw: RawContainer,
  children: ComposeNode[],
): { arrangement: ArrangementAxis | undefined; invalid: boolean } => {
  if (raw.arrangement === "none") {
    return { arrangement: undefined, invalid: false };
  }

  if (raw.arrangement === "ordered") {
    return { arrangement: { kind: "ordered" }, invalid: false };
  }

  if (raw.invalid !== null) {
    const built =
      raw.arrangement === "parallel"
        ? invalidParallel(children, raw.invalid)
        : invalidSuperset(children, raw.invalid);

    if (built !== null) {
      return { arrangement: built, invalid: true };
    }
  }

  const valid = raw.arrangement === "parallel" ? validParallel(children) : validSuperset(children);

  return valid === null
    ? { arrangement: undefined, invalid: false }
    : { arrangement: valid, invalid: false };
};
