import { describe, expect, it } from "vitest";

import type { Composition } from "@repo/contracts/lms/composition";
import type { SchemaWithBody } from "@repo/contracts/lms/schema";
import type { SchemaRow } from "@repo/contracts/lms/schema-row";

import type { ComposeContainer, ComposeRow } from "../compose-tree.types";

import { diffComposeAxesAgainstOriginal } from "./diff-compose-axes";
import { asNodeId } from "./id-factory";
import { schemaWithBodyToComposeContainer } from "./schema-to-compose";

const EPOCH = new Date(0);
const TOP_CUID = "ckscoringtopaaaaaaaaaaaaa";
const BLOCK_CUID = "ckscoringblockaaaaaaaaaaa";
const ROW_CUID = "ckscoringrow1aaaaaaaaaaaa";

const SEEDED_SCORING: Composition["scoring"] = {
  kind: "amrap",
  condition: { appliesToRounds: [2, 3] },
};

const seededComposition: Composition = {
  repetition: { kind: "count", count: 3 },
  scoring: SEEDED_SCORING,
};

const schemaWithComposition = (composition: Composition): SchemaWithBody => ({
  schema: {
    id: TOP_CUID,
    blockId: BLOCK_CUID,
    parentSchemaId: null,
    order: 1,
    header: null,
    intensity: null,
    composition,
    label: null,
    notes: null,
    createdAt: EPOCH,
    updatedAt: EPOCH,
  },
  rows: [],
  subSchemas: [],
});

const seededSchema = (): SchemaWithBody => schemaWithComposition(seededComposition);

const restSlotRow = (id: string): SchemaRow => ({
  id,
  schemaId: TOP_CUID,
  order: 1,
  rowKind: "REST_SLOT",
  rowPayload: { rowKind: "REST_SLOT" },
  load: null,
  reps: null,
  side: null,
  tempo: null,
  position: null,
  sequence: null,
  intensity: null,
  media: null,
  compoundRep: null,
  notes: null,
  createdAt: EPOCH,
  updatedAt: EPOCH,
});

const hydratedRoot = (schema: SchemaWithBody): ComposeContainer => {
  const result = schemaWithBodyToComposeContainer(schema);

  if (!result.ok) {
    throw new Error(`inverse refused: ${result.reason.kind}`);
  }

  const root = result.program.weeks[0]?.days[0]?.sessions[0]?.blocks[0]?.root;

  if (root === undefined) {
    throw new Error("missing hydrated root");
  }

  return root;
};

const topContainer = (root: ComposeContainer): ComposeContainer => {
  const top = root.children.find(
    (child): child is ComposeContainer => child.nodeType === "container",
  );

  if (top === undefined) {
    throw new Error("missing top container");
  }

  return top;
};

describe("diffComposeAxesAgainstOriginal preserves seeded scoring.condition", () => {
  it("re-emits the seeded scoring byte-for-byte after an unrelated repetition edit", () => {
    const schema = seededSchema();
    const root = hydratedRoot(schema);
    const top = topContainer(root);

    top.repetition = { kind: "count", count: 5 };

    const result = diffComposeAxesAgainstOriginal(schema, root);

    expect(result.ok).toBe(true);

    if (!result.ok) {
      return;
    }

    expect(result.updates).toHaveLength(1);

    const [update] = result.updates;

    expect(update?.composition?.repetition).toEqual({ kind: "count", count: 5 });
    expect(update?.composition?.scoring).toEqual({
      kind: "amrap",
      condition: { appliesToRounds: [2, 3] },
    });
  });

  it("emits no update when nothing changed (scoring round-trips inertly)", () => {
    const schema = seededSchema();
    const root = hydratedRoot(schema);

    const result = diffComposeAxesAgainstOriginal(schema, root);

    expect(result).toEqual({ ok: true, updates: [] });
  });

  it("refuses with structural-divergence when a row is added to the draft", () => {
    const schema = seededSchema();
    const root = hydratedRoot(schema);
    const top = topContainer(root);

    const addedRow: ComposeRow = {
      nodeType: "row",
      id: asNodeId(ROW_CUID),
      rowKind: "REST_SLOT",
      rowPayload: { rowKind: "REST_SLOT" },
      reps: null,
      load: null,
      side: null,
      tempo: null,
      position: null,
      intensity: null,
      notes: null,
      editorDraft: undefined,
    };

    top.children.push(addedRow);

    const result = diffComposeAxesAgainstOriginal(schema, root);

    expect(result).toEqual({ ok: false, reason: "structural-divergence" });
  });

  it("refuses with structural-divergence when an original row is dropped from the draft", () => {
    const schema = seededSchema();

    schema.rows = [restSlotRow(ROW_CUID)];
    const root = hydratedRoot(schema);
    const top = topContainer(root);

    top.children = [];

    const result = diffComposeAxesAgainstOriginal(schema, root);

    expect(result).toEqual({ ok: false, reason: "structural-divergence" });
  });
});

const scoringShapes: { name: string; scoring: Composition["scoring"] }[] = [
  {
    name: "a for_time directive carrying a round condition",
    scoring: { kind: "for_time", condition: { appliesToRounds: [1] } },
  },
  {
    name: "a progressive directive carrying both a seed and a round condition",
    scoring: { kind: "progressive", seed: "21-15-9", condition: { appliesToRounds: [2] } },
  },
];

describe("diffComposeAxesAgainstOriginal preserves seeded scoring across more kinds", () => {
  for (const { name, scoring } of scoringShapes) {
    it(`re-emits ${name} verbatim after an unrelated repetition edit`, () => {
      const schema = schemaWithComposition({ repetition: { kind: "count", count: 3 }, scoring });
      const root = hydratedRoot(schema);
      const top = topContainer(root);

      top.repetition = { kind: "count", count: 8 };

      const result = diffComposeAxesAgainstOriginal(schema, root);

      expect(result.ok).toBe(true);

      if (!result.ok) {
        return;
      }

      expect(result.updates).toHaveLength(1);
      expect(result.updates[0]?.composition?.scoring).toEqual(scoring);
      expect(result.updates[0]?.composition?.repetition).toEqual({ kind: "count", count: 8 });
    });
  }
});
