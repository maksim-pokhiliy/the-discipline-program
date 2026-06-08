import fc from "fast-check";

import { asNodeId } from "../../lib/axis-draft-id";
import type {
  ComposeContainer,
  ComposeNode,
  ComposeRow,
  NodeId,
  RepetitionAxis,
  RestAxis,
  ScoringDirective,
} from "../compose-tree.types";

import {
  deriveArrangement,
  type RawArrangement,
  type RawContainer,
  type RawInvalid,
  type RawNode,
  type RawRow,
} from "./compose-arbitrary-arrangement";

const MAX_DEPTH = 3;

export type GeneratedTree = { container: ComposeContainer; isInvalid: boolean };

const repetitionArbitrary: fc.Arbitrary<RepetitionAxis> = fc.oneof(
  fc.constant<RepetitionAxis>({ kind: "once" }),
  fc.integer({ min: 1, max: 50 }).map<RepetitionAxis>((count) => ({ kind: "count", count })),
  fc
    .tuple(fc.integer({ min: 1, max: 20 }), fc.integer({ min: 1, max: 20 }))
    .map<RepetitionAxis>(([a, b]) => ({
      kind: "count",
      count: { min: Math.min(a, b), max: Math.max(a, b) + 1 },
    })),
  fc
    .array(fc.integer({ min: 1, max: 30 }), { minLength: 1, maxLength: 4 })
    .map<RepetitionAxis>((steps) => ({ kind: "ladder", steps })),
  fc
    .tuple(fc.integer({ min: 1, max: 5 }), fc.integer({ min: 1, max: 20 }))
    .map<RepetitionAxis>(([everyMin, rounds]) => ({ kind: "cadence", everyMin, rounds })),
  fc
    .tuple(
      fc.integer({ min: 1, max: 10 }),
      fc.integer({ min: 0, max: 5 }),
      fc.integer({ min: 1, max: 8 }),
    )
    .map<RepetitionAxis>(([workMin, offMin, count]) => ({
      kind: "interval",
      workMin,
      offMin,
      count,
    })),
  fc
    .integer({ min: 1, max: 30 })
    .map<RepetitionAxis>((min) => ({ kind: "timeCap", cap: { min, unit: "min" } })),
);

const scoringArbitrary: fc.Arbitrary<ScoringDirective> = fc.oneof(
  fc.constant<ScoringDirective>({ kind: "prescribed" }),
  fc.constant<ScoringDirective>({ kind: "amrap" }),
  fc.constant<ScoringDirective>({ kind: "for_time" }),
  fc.constant<ScoringDirective>({ kind: "max_in_remaining" }),
  fc.constant<ScoringDirective>({ kind: "total" }),
  fc
    .string({ minLength: 1, maxLength: 8 })
    .map<ScoringDirective>((seed) => ({ kind: "progressive", seed: `seed-${seed}` })),
);

const restArbitrary: fc.Arbitrary<RestAxis> = fc
  .integer({ min: 1, max: 180 })
  .map<RestAxis>((value) => ({ duration: { value, unit: "sec" }, scope: "between_rounds" }));

const optional = <T>(arb: fc.Arbitrary<T>): fc.Arbitrary<T | null> =>
  fc.option(arb, { nil: null, freq: 2 });

const arrangementChoice: fc.Arbitrary<RawArrangement> = fc.constantFrom<RawArrangement>(
  "none",
  "ordered",
  "parallel",
  "superset",
);

const invalidChoice: fc.Arbitrary<RawInvalid> = fc.constantFrom<RawInvalid>(
  "single-track",
  "dangling-track",
  "nonpositive-enumeration",
  "grandchild-superset",
  "single-row-pair",
);

const rawTree = fc.letrec<{ node: RawNode; container: RawContainer; row: RawRow }>((tie) => ({
  row: fc.constant<RawRow>({ kind: "row" }),
  node: fc.oneof({ depthSize: "small", withCrossShrink: true }, tie("row"), tie("container")),
  container: fc
    .tuple(
      optional(repetitionArbitrary),
      optional(scoringArbitrary),
      optional(restArbitrary),
      arrangementChoice,
      fc.option(invalidChoice, { nil: null, freq: 4 }),
      fc.array(tie("node"), { maxLength: 4 }),
    )
    .map(
      ([repetition, scoring, rest, arrangement, invalid, children]): RawContainer => ({
        kind: "container",
        repetition,
        scoring,
        rest,
        arrangement,
        invalid,
        children,
      }),
    ),
}));

const REST_SLOT_ROW = (id: NodeId): ComposeRow => ({
  nodeType: "row",
  id,
  rowKind: "REST_SLOT",
  rowPayload: { rowKind: "REST_SLOT" },
  reps: null,
  load: null,
  side: null,
  tempo: null,
  position: null,
  intensity: null,
  notes: null,
  editorDraft: null,
});

type IdMinter = () => NodeId;

const makeMinter = (): IdMinter => {
  let counter = 0;

  return () => {
    counter += 1;

    return asNodeId(`gen-node-${counter}`);
  };
};

const materialize = (
  raw: RawNode,
  mint: IdMinter,
  depth: number,
): { node: ComposeNode; invalid: boolean } => {
  if (raw.kind === "row" || depth >= MAX_DEPTH) {
    return { node: REST_SLOT_ROW(mint()), invalid: false };
  }

  const built = raw.children.map((child) => materialize(child, mint, depth + 1));
  const children = built.map((entry) => entry.node);
  const childInvalid = built.some((entry) => entry.invalid);

  const { arrangement, invalid } = deriveArrangement(raw, children);

  const container: ComposeContainer = {
    nodeType: "container",
    id: mint(),
    header: null,
    notes: null,
    ...(raw.repetition !== null && { repetition: raw.repetition }),
    ...(raw.scoring !== null && { scoring: raw.scoring }),
    ...(raw.rest !== null && { rest: raw.rest }),
    ...(arrangement !== undefined && { arrangement }),
    children,
  };

  return { node: container, invalid: invalid || childInvalid };
};

export const draftContainerArbitrary = (): fc.Arbitrary<GeneratedTree> =>
  rawTree.container.map((raw) => {
    const mint = makeMinter();
    const { node, invalid } = materialize(raw, mint, 0);

    if (node.nodeType !== "container") {
      throw new Error("expected a container at the tree root");
    }

    return { container: node, isInvalid: invalid };
  });
