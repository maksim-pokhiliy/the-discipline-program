import fc from "fast-check";
import { describe, expect, it } from "vitest";

import type { Composition } from "@repo/contracts/lms/composition";
import type { SchemaWithBody } from "@repo/contracts/lms/schema";
import type { SchemaRow } from "@repo/contracts/lms/schema-row";

import type { ComposeContainer, ComposeNode, ComposeRow, NodeId } from "../compose-tree.types";

import { resolveArrangement } from "./arrangement-resolve";
import { draftContainerArbitrary } from "./compose-arbitraries";
import { type CreateSchemaPlanNode, composeRootToCreatePlan } from "./compose-to-create-requests";
import { asNodeId } from "./id-factory";
import { schemaWithBodyToComposeContainer } from "./schema-to-compose";

const NUM_RUNS = 300;
const CUID_BODY_LENGTH = 23;
const EPOCH = new Date(0);

const mountRoot = (child: ComposeContainer): ComposeContainer => ({
  nodeType: "container",
  id: asNodeId("inverse-root"),
  header: null,
  notes: null,
  children: [child],
});

const syntheticCuid = (index: number): string =>
  `ck${String(index).padStart(CUID_BODY_LENGTH, "0")}`;

const buildCuidMap = (nodes: CreateSchemaPlanNode[]): Map<NodeId, string> => {
  const map = new Map<NodeId, string>();
  let counter = 0;

  const next = (): string => {
    counter += 1;

    return syntheticCuid(counter);
  };

  const walk = (node: CreateSchemaPlanNode): void => {
    map.set(node.draftNodeId, next());

    for (const entry of node.rows) {
      map.set(entry.draftNodeId, next());
    }

    node.children.forEach(walk);
  };

  nodes.forEach(walk);

  return map;
};

const requireCuid = (map: Map<NodeId, string>, id: NodeId): string => {
  const cuid = map.get(id);

  if (cuid === undefined) {
    throw new Error(`no synthetic cuid minted for ${id}`);
  }

  return cuid;
};

const foldComposition = (node: CreateSchemaPlanNode, map: Map<NodeId, string>): Composition => {
  const base = node.schema.composition as Composition;

  if (node.deferredArrangement === undefined) {
    return base;
  }

  const resolved = resolveArrangement(node.deferredArrangement, map);

  return resolved.ok ? { ...base, arrangement: resolved.arrangement } : base;
};

const projectRow = (
  entry: CreateSchemaPlanNode["rows"][number],
  schemaId: string,
  map: Map<NodeId, string>,
): SchemaRow => ({
  id: requireCuid(map, entry.draftNodeId),
  schemaId,
  order: 1,
  rowKind: entry.row.rowKind,
  rowPayload: entry.row.rowPayload,
  load: entry.row.load ?? null,
  reps: entry.row.reps ?? null,
  side: entry.row.side ?? null,
  tempo: entry.row.tempo ?? null,
  position: entry.row.position ?? null,
  sequence: null,
  intensity: entry.row.intensity ?? null,
  media: null,
  compoundRep: null,
  notes: entry.row.notes ?? null,
  createdAt: EPOCH,
  updatedAt: EPOCH,
});

const projectSchema = (
  node: CreateSchemaPlanNode,
  parentSchemaId: string | null,
  map: Map<NodeId, string>,
): SchemaWithBody => {
  const id = requireCuid(map, node.draftNodeId);

  return {
    schema: {
      id,
      blockId: syntheticCuid(0),
      parentSchemaId,
      order: 1,
      header: node.schema.header ?? null,
      intensity: null,
      composition: foldComposition(node, map),
      label: null,
      notes: node.schema.notes ?? null,
      createdAt: EPOCH,
      updatedAt: EPOCH,
    },
    rows: node.rows.map((entry) => projectRow(entry, id, map)),
    subSchemas: node.children.map((child) => projectSchema(child, id, map)),
  };
};

const onlyContainer = (children: ComposeNode[]): ComposeContainer => {
  const container = children.find(
    (child): child is ComposeContainer => child.nodeType === "container",
  );

  if (container === undefined) {
    throw new Error("expected one hydrated container");
  }

  return container;
};

const rowSet = (children: ComposeNode[]): Set<string> =>
  new Set(
    children
      .filter((child): child is ComposeRow => child.nodeType === "row")
      .map((row) => `${row.id}:${row.rowKind}`),
  );

describe("schemaWithBodyToComposeContainer forward∘inverse axis identity", () => {
  it("preserves repetition, arrangement, rest and rows for every resolvable forward tree", () => {
    fc.assert(
      fc.property(draftContainerArbitrary(), ({ container, isInvalid }) => {
        fc.pre(!isInvalid);

        const forward = composeRootToCreatePlan(mountRoot(container));

        fc.pre(forward.ok);

        if (!forward.ok) {
          return;
        }

        const map = buildCuidMap(forward.nodes);
        const topNode = forward.nodes[0];

        if (topNode === undefined) {
          return;
        }

        const projected = projectSchema(topNode, null, map);
        const composition = foldComposition(topNode, map);

        const result = schemaWithBodyToComposeContainer(projected);

        expect(result.ok).toBe(true);

        if (!result.ok) {
          return;
        }

        const hydrated = onlyContainer(
          result.program.weeks[0]?.days[0]?.sessions[0]?.blocks[0]?.root.children ?? [],
        );

        expect(hydrated.repetition).toEqual(composition.repetition);
        expect(hydrated.rest).toEqual(composition.rest);
        expect(rowSet(hydrated.children)).toEqual(
          rowSet(topNode.rows.map((entry) => projectedRow(entry, map))),
        );
      }),
      { numRuns: NUM_RUNS },
    );
  });
});

const projectedRow = (
  entry: CreateSchemaPlanNode["rows"][number],
  map: Map<NodeId, string>,
): ComposeRow => ({
  nodeType: "row",
  id: asNodeId(requireCuid(map, entry.draftNodeId)),
  rowKind: entry.row.rowKind,
  rowPayload: entry.row.rowPayload,
  reps: entry.row.reps ?? null,
  load: entry.row.load ?? null,
  side: entry.row.side ?? null,
  tempo: entry.row.tempo ?? null,
  position: entry.row.position ?? null,
  intensity: entry.row.intensity ?? null,
  notes: entry.row.notes ?? null,
  editorDraft: undefined,
});

const cuidA = "ckaaaaaaaaaaaaaaaaaaaaaaa";
const cuidB = "ckbbbbbbbbbbbbbbbbbbbbbbb";
const cuidC = "ckcccccccccccccccccccccccc";
const cuidRow1 = "ckrrrrrrrrrrrrrrrrrrrrrr1";
const cuidRow2 = "ckrrrrrrrrrrrrrrrrrrrrrr2";

const restSlotRow = (id: string, schemaId: string): SchemaRow => ({
  id,
  schemaId,
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

const leafSchema = (
  id: string,
  rows: SchemaRow[],
  composition: Composition | null,
): SchemaWithBody => ({
  schema: {
    id,
    blockId: cuidA,
    parentSchemaId: cuidA,
    order: 1,
    header: null,
    intensity: null,
    composition,
    label: null,
    notes: null,
    createdAt: EPOCH,
    updatedAt: EPOCH,
  },
  rows,
  subSchemas: [],
});

const topSchema = (
  composition: Composition | null,
  subSchemas: SchemaWithBody[],
): SchemaWithBody => ({
  schema: {
    id: cuidA,
    blockId: cuidA,
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
  subSchemas,
});

describe("schemaWithBodyToComposeContainer arrangement ref identity", () => {
  it("keeps real cuids as branded NodeId refs for a parallel arrangement", () => {
    const trackB = leafSchema(cuidB, [], null);
    const trackC = leafSchema(cuidC, [], null);
    const schema = topSchema(
      {
        arrangement: {
          kind: "parallel",
          interleaveOrder: "round_by_round",
          tracks: [{ childSchemaId: cuidB }, { childSchemaId: cuidC }],
        },
      },
      [trackB, trackC],
    );

    const result = schemaWithBodyToComposeContainer(schema);

    expect(result.ok).toBe(true);

    if (!result.ok) {
      return;
    }

    const hydrated = onlyContainer(
      result.program.weeks[0]?.days[0]?.sessions[0]?.blocks[0]?.root.children ?? [],
    );

    expect(hydrated.arrangement).toEqual({
      kind: "parallel",
      interleaveOrder: "round_by_round",
      tracks: [{ childSchemaId: cuidB }, { childSchemaId: cuidC }],
    });
  });

  it("keeps real cuids as branded NodeId refs for a superset arrangement", () => {
    const row1 = restSlotRow(cuidRow1, cuidA);
    const row2 = restSlotRow(cuidRow2, cuidA);
    const schema = topSchema(
      {
        arrangement: { kind: "superset", pairs: [{ label: "pair", rowIds: [cuidRow1, cuidRow2] }] },
      },
      [],
    );

    schema.rows = [row1, row2];

    const result = schemaWithBodyToComposeContainer(schema);

    expect(result.ok).toBe(true);

    if (!result.ok) {
      return;
    }

    const hydrated = onlyContainer(
      result.program.weeks[0]?.days[0]?.sessions[0]?.blocks[0]?.root.children ?? [],
    );

    expect(hydrated.arrangement).toEqual({
      kind: "superset",
      pairs: [{ label: "pair", rowIds: [cuidRow1, cuidRow2] }],
    });
  });
});

describe("schemaWithBodyToComposeContainer refusals and null composition", () => {
  it("refuses a range repetition with an unrepresentable-repetition reason", () => {
    const schema = topSchema({ repetition: { kind: "range", range: { min: 3, max: 5 } } }, []);

    const result = schemaWithBodyToComposeContainer(schema);

    expect(result).toEqual({
      ok: false,
      reason: { kind: "unrepresentable-repetition", schemaId: cuidA, repetitionKind: "range" },
    });
  });

  it("refuses when a nested sub-schema carries a range repetition", () => {
    const child = leafSchema(cuidB, [], {
      repetition: { kind: "range", range: { min: 2, max: 4 } },
    });
    const schema = topSchema({ repetition: { kind: "count", count: 3 } }, [child]);

    const result = schemaWithBodyToComposeContainer(schema);

    expect(result).toEqual({
      ok: false,
      reason: { kind: "unrepresentable-repetition", schemaId: cuidB, repetitionKind: "range" },
    });
  });

  it("hydrates a null composition as a container with no axes and intact rows", () => {
    const row = restSlotRow(cuidRow1, cuidA);
    const schema = topSchema(null, []);

    schema.rows = [row];

    const result = schemaWithBodyToComposeContainer(schema);

    expect(result.ok).toBe(true);

    if (!result.ok) {
      return;
    }

    const hydrated = onlyContainer(
      result.program.weeks[0]?.days[0]?.sessions[0]?.blocks[0]?.root.children ?? [],
    );

    expect(hydrated.repetition).toBeUndefined();
    expect(hydrated.arrangement).toBeUndefined();
    expect(hydrated.scoring).toBeUndefined();
    expect(hydrated.rest).toBeUndefined();
    expect(rowSet(hydrated.children)).toEqual(new Set([`${cuidRow1}:REST_SLOT`]));
  });
});

const explicitRepetitionFixtures: { name: string; repetition: Composition["repetition"] }[] = [
  {
    name: "a count carried as a {min,max} range",
    repetition: { kind: "count", count: { min: 2, max: 4 } },
  },
  { name: "a multi-step ladder", repetition: { kind: "ladder", steps: [21, 15, 9] } },
  { name: "a window", repetition: { kind: "window", startHhMm: "06:00", endHhMm: "07:30" } },
  { name: "an interval", repetition: { kind: "interval", workMin: 3, offMin: 1, count: 5 } },
];

describe("schemaWithBodyToComposeContainer hydrates explicit repetition shapes the arbitrary may miss", () => {
  for (const { name, repetition } of explicitRepetitionFixtures) {
    it(`hydrates ${name} into an identical draft repetition`, () => {
      const schema = topSchema({ repetition }, []);

      const result = schemaWithBodyToComposeContainer(schema);

      expect(result.ok).toBe(true);

      if (!result.ok) {
        return;
      }

      const hydrated = onlyContainer(
        result.program.weeks[0]?.days[0]?.sessions[0]?.blocks[0]?.root.children ?? [],
      );

      expect(hydrated.repetition).toEqual(repetition);
    });
  }
});
