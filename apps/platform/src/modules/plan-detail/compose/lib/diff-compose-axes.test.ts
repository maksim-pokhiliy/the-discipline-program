import { describe, expect, it } from "vitest";

import type { Composition, RepetitionAxis } from "@repo/contracts/lms/composition";
import type { SchemaWithBody } from "@repo/contracts/lms/schema";
import type { SchemaRow } from "@repo/contracts/lms/schema-row";

import type { ComposeContainer } from "../compose-tree.types";

import { diffComposeAxesAgainstOriginal } from "./diff-compose-axes";
import { asNodeId } from "./id-factory";
import { schemaWithBodyToComposeContainer } from "./schema-to-compose";

const EPOCH = new Date(0);
const TOP_CUID = "ckdifftopaaaaaaaaaaaaaaaa";
const CHILD_A_CUID = "ckdiffchildaaaaaaaaaaaaaa";
const CHILD_B_CUID = "ckdiffchildbbbbbbbbbbbbbb";
const ROW_DOWN_CUID = "ckdiffrowdownaaaaaaaaaaaa";
const ROW_UP_CUID = "ckdiffrowupaaaaaaaaaaaaaa";
const ROW_CURL_CUID = "ckdiffrowcurlaaaaaaaaaaaa";
const ROW_EXT_CUID = "ckdiffrowextaaaaaaaaaaaaa";
const ROW_PRESS_CUID = "ckdiffrowpressaaaaaaaaaaa";
const ROW_PULL_CUID = "ckdiffrowpullaaaaaaaaaaaa";

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
  composition: Composition | null,
  rows: SchemaRow[] = [],
): SchemaWithBody => ({
  schema: {
    id,
    blockId: TOP_CUID,
    parentSchemaId: TOP_CUID,
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
    id: TOP_CUID,
    blockId: TOP_CUID,
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

const childContainer = (top: ComposeContainer, id: string): ComposeContainer => {
  const child = top.children.find(
    (node): node is ComposeContainer => node.nodeType === "container" && node.id === id,
  );

  if (child === undefined) {
    throw new Error(`missing child container ${id}`);
  }

  return child;
};

describe("diffComposeAxesAgainstOriginal axis changes", () => {
  it("emits exactly one update for a single rest-axis edit", () => {
    const schema = topSchema({ repetition: { kind: "count", count: 3 } }, []);
    const root = hydratedRoot(schema);

    topContainer(root).rest = { duration: { value: 90, unit: "sec" }, scope: "between_rounds" };

    const result = diffComposeAxesAgainstOriginal(schema, root);

    expect(result.ok).toBe(true);

    if (!result.ok) {
      return;
    }

    expect(result.updates).toHaveLength(1);
    expect(result.updates[0]?.schemaId).toBe(TOP_CUID);
    expect(result.updates[0]?.composition).toEqual({
      repetition: { kind: "count", count: 3 },
      rest: { duration: { value: 90, unit: "sec" }, scope: "between_rounds" },
    });
  });

  it("re-points an existing parallel track and folds real-cuid refs into the contract arrangement", () => {
    const schema = topSchema(
      {
        arrangement: {
          kind: "parallel",
          interleaveOrder: "round_by_round",
          tracks: [{ childSchemaId: CHILD_A_CUID }, { childSchemaId: CHILD_B_CUID }],
        },
      },
      [leafSchema(CHILD_A_CUID, null), leafSchema(CHILD_B_CUID, null)],
    );
    const root = hydratedRoot(schema);
    const top = topContainer(root);

    if (top.arrangement?.kind === "parallel") {
      top.arrangement.interleaveOrder = "track_by_track";
    }

    const result = diffComposeAxesAgainstOriginal(schema, root);

    expect(result.ok).toBe(true);

    if (!result.ok) {
      return;
    }

    expect(result.updates).toHaveLength(1);
    expect(result.updates[0]?.composition).toEqual({
      arrangement: {
        kind: "parallel",
        interleaveOrder: "track_by_track",
        tracks: [{ childSchemaId: CHILD_A_CUID }, { childSchemaId: CHILD_B_CUID }],
      },
    });
  });

  it("emits no update when an unchanged tree is re-diffed", () => {
    const schema = topSchema({ repetition: { kind: "count", count: 3 } }, [
      leafSchema(CHILD_A_CUID, { scoring: { kind: "amrap" } }),
    ]);
    const root = hydratedRoot(schema);

    const result = diffComposeAxesAgainstOriginal(schema, root);

    expect(result).toEqual({ ok: true, updates: [] });
  });

  it("diffs nested containers independently and emits only the changed one", () => {
    const schema = topSchema({ repetition: { kind: "count", count: 3 } }, [
      leafSchema(CHILD_A_CUID, { repetition: { kind: "count", count: 2 } }),
    ]);
    const root = hydratedRoot(schema);
    const top = topContainer(root);

    childContainer(top, CHILD_A_CUID).repetition = { kind: "count", count: 7 };

    const result = diffComposeAxesAgainstOriginal(schema, root);

    expect(result.ok).toBe(true);

    if (!result.ok) {
      return;
    }

    expect(result.updates).toHaveLength(1);
    expect(result.updates[0]?.schemaId).toBe(CHILD_A_CUID);
    expect(result.updates[0]?.composition).toEqual({ repetition: { kind: "count", count: 7 } });
  });

  it("refuses with structural-divergence when a sub-schema is reparented", () => {
    const schema = topSchema({ repetition: { kind: "count", count: 3 } }, [
      leafSchema(CHILD_A_CUID, null),
      leafSchema(CHILD_B_CUID, null),
    ]);
    const root = hydratedRoot(schema);
    const top = topContainer(root);

    const moved = childContainer(top, CHILD_B_CUID);

    top.children = top.children.filter((child) => child.id !== CHILD_B_CUID);
    childContainer(top, CHILD_A_CUID).children.push(moved);

    const result = diffComposeAxesAgainstOriginal(schema, root);

    expect(result).toEqual({ ok: false, reason: "structural-divergence" });
  });

  it("refuses with structural-divergence when a sibling container is added at the synthetic root", () => {
    const schema = topSchema({ repetition: { kind: "count", count: 3 } }, []);
    const root = hydratedRoot(schema);

    root.children.push({
      nodeType: "container",
      id: asNodeId(CHILD_A_CUID),
      header: null,
      notes: null,
      children: [],
    });

    const result = diffComposeAxesAgainstOriginal(schema, root);

    expect(result).toEqual({ ok: false, reason: "structural-divergence" });
  });
});

const orderedComposition: Composition = {
  rest: { duration: { value: 60, unit: "sec" }, scope: "between_rounds" },
  scoring: { kind: "amrap" },
  repetition: { kind: "count", count: 4 },
};

describe("diffComposeAxesAgainstOriginal is insensitive to stored composition key order", () => {
  it("emits no update when only the stored key order differs from the assembled order", () => {
    const schema = topSchema(orderedComposition, []);
    const root = hydratedRoot(schema);

    const result = diffComposeAxesAgainstOriginal(schema, root);

    expect(result).toEqual({ ok: true, updates: [] });
  });
});

const UNRELATED_REST_EDIT: Composition["rest"] = {
  duration: { value: 45, unit: "sec" },
  scope: "between_rounds",
};

const repetitionShapes: { name: string; repetition: RepetitionAxis }[] = [
  {
    name: "a count carried as a {min,max} range (not the range axis)",
    repetition: { kind: "count", count: { min: 2, max: 4 } },
  },
  { name: "a multi-step ladder", repetition: { kind: "ladder", steps: [21, 15, 9] } },
  { name: "a window", repetition: { kind: "window", startHhMm: "06:00", endHhMm: "07:30" } },
  { name: "an interval", repetition: { kind: "interval", workMin: 3, offMin: 1, count: 5 } },
];

describe("diffComposeAxesAgainstOriginal round-trips every representable repetition shape through an unrelated edit", () => {
  for (const { name, repetition } of repetitionShapes) {
    it(`re-emits ${name} byte-for-byte after editing rest`, () => {
      const schema = topSchema({ repetition }, []);
      const root = hydratedRoot(schema);

      topContainer(root).rest = UNRELATED_REST_EDIT;

      const result = diffComposeAxesAgainstOriginal(schema, root);

      expect(result.ok).toBe(true);

      if (!result.ok) {
        return;
      }

      expect(result.updates).toHaveLength(1);
      expect(result.updates[0]?.composition?.repetition).toEqual(repetition);
      expect(result.updates[0]?.composition?.rest).toEqual(UNRELATED_REST_EDIT);
    });
  }
});

const restShapes: { name: string; rest: Composition["rest"] }[] = [
  {
    name: "a range_sec unit carrying rangeMax",
    rest: { duration: { value: 60, unit: "range_sec", rangeMax: 90 }, scope: "between_rounds" },
  },
  {
    name: "a qualifier and a setIndex on an after_specific_set scope",
    rest: {
      duration: { value: 120, unit: "sec" },
      scope: "after_specific_set",
      qualifier: "until_recovery",
      setIndex: 3,
    },
  },
];

describe("diffComposeAxesAgainstOriginal round-trips every RestSpec shape through a repetition edit", () => {
  for (const { name, rest } of restShapes) {
    it(`re-emits ${name} byte-for-byte after editing repetition`, () => {
      const schema = topSchema({ repetition: { kind: "count", count: 3 }, rest }, []);
      const root = hydratedRoot(schema);

      topContainer(root).repetition = { kind: "count", count: 6 };

      const result = diffComposeAxesAgainstOriginal(schema, root);

      expect(result.ok).toBe(true);

      if (!result.ok) {
        return;
      }

      expect(result.updates).toHaveLength(1);
      expect(result.updates[0]?.composition?.rest).toEqual(rest);
      expect(result.updates[0]?.composition?.repetition).toEqual({ kind: "count", count: 6 });
    });
  }
});

const richParallelSchema = (): SchemaWithBody =>
  topSchema(
    {
      arrangement: {
        kind: "parallel",
        interleaveOrder: "round_by_round",
        tracks: [
          { childSchemaId: CHILD_A_CUID, setEnumeration: [1, 2] },
          { childSchemaId: CHILD_B_CUID, pairedWithRowId: ROW_DOWN_CUID },
        ],
      },
    },
    [
      leafSchema(CHILD_A_CUID, null, [restSlotRow(ROW_DOWN_CUID, CHILD_A_CUID)]),
      leafSchema(CHILD_B_CUID, null, [restSlotRow(ROW_UP_CUID, CHILD_B_CUID)]),
    ],
  );

describe("diffComposeAxesAgainstOriginal preserves the richest arrangement shapes", () => {
  it("keeps both setEnumeration and pairedWithRowId on a parallel track after re-pointing interleaveOrder", () => {
    const schema = richParallelSchema();
    const root = hydratedRoot(schema);
    const top = topContainer(root);

    if (top.arrangement?.kind === "parallel") {
      top.arrangement.interleaveOrder = "track_by_track";
    }

    const result = diffComposeAxesAgainstOriginal(schema, root);

    expect(result.ok).toBe(true);

    if (!result.ok) {
      return;
    }

    expect(result.updates).toHaveLength(1);
    expect(result.updates[0]?.composition?.arrangement).toEqual({
      kind: "parallel",
      interleaveOrder: "track_by_track",
      tracks: [
        { childSchemaId: CHILD_A_CUID, setEnumeration: [1, 2] },
        { childSchemaId: CHILD_B_CUID, pairedWithRowId: ROW_DOWN_CUID },
      ],
    });
  });

  it("emits no update for an unchanged superset of two pairs each holding two distinct rows", () => {
    const schema = topSchema(
      {
        arrangement: {
          kind: "superset",
          pairs: [
            { label: "Biceps / triceps", rowIds: [ROW_CURL_CUID, ROW_EXT_CUID] },
            { label: "Press / pull", rowIds: [ROW_PRESS_CUID, ROW_PULL_CUID] },
          ],
        },
      },
      [],
    );

    schema.rows = [
      restSlotRow(ROW_CURL_CUID, TOP_CUID),
      restSlotRow(ROW_EXT_CUID, TOP_CUID),
      restSlotRow(ROW_PRESS_CUID, TOP_CUID),
      restSlotRow(ROW_PULL_CUID, TOP_CUID),
    ];

    const root = hydratedRoot(schema);

    const result = diffComposeAxesAgainstOriginal(schema, root);

    expect(result).toEqual({ ok: true, updates: [] });
  });
});

describe("diffComposeAxesAgainstOriginal refuses every structural-divergence variant", () => {
  it("refuses when a row is reparented to a sibling container (ids same, parent differs)", () => {
    const schema = topSchema({ repetition: { kind: "count", count: 3 } }, [
      leafSchema(CHILD_A_CUID, null, [restSlotRow(ROW_DOWN_CUID, CHILD_A_CUID)]),
      leafSchema(CHILD_B_CUID, null),
    ]);
    const root = hydratedRoot(schema);
    const top = topContainer(root);

    const fromContainer = childContainer(top, CHILD_A_CUID);
    const toContainer = childContainer(top, CHILD_B_CUID);
    const movedRow = fromContainer.children.find((child) => child.id === ROW_DOWN_CUID);

    if (movedRow === undefined) {
      throw new Error("seeded row missing from hydrated tree");
    }

    fromContainer.children = fromContainer.children.filter((child) => child.id !== ROW_DOWN_CUID);
    toContainer.children.push(movedRow);

    const result = diffComposeAxesAgainstOriginal(schema, root);

    expect(result).toEqual({ ok: false, reason: "structural-divergence" });
  });

  it("refuses when two sibling containers swap their nested children so a per-id parent differs", () => {
    const schema = topSchema({ repetition: { kind: "count", count: 3 } }, [
      leafSchema(CHILD_A_CUID, null, [restSlotRow(ROW_DOWN_CUID, CHILD_A_CUID)]),
      leafSchema(CHILD_B_CUID, null, [restSlotRow(ROW_UP_CUID, CHILD_B_CUID)]),
    ]);
    const root = hydratedRoot(schema);
    const top = topContainer(root);

    const containerA = childContainer(top, CHILD_A_CUID);
    const containerB = childContainer(top, CHILD_B_CUID);
    const rowFromA = containerA.children.find((child) => child.id === ROW_DOWN_CUID);
    const rowFromB = containerB.children.find((child) => child.id === ROW_UP_CUID);

    if (rowFromA === undefined || rowFromB === undefined) {
      throw new Error("seeded rows missing from hydrated tree");
    }

    containerA.children = [rowFromB];
    containerB.children = [rowFromA];

    const result = diffComposeAxesAgainstOriginal(schema, root);

    expect(result).toEqual({ ok: false, reason: "structural-divergence" });
  });

  it("refuses when a sub-container is deleted leaving N-1 children (size mismatch)", () => {
    const schema = topSchema({ repetition: { kind: "count", count: 3 } }, [
      leafSchema(CHILD_A_CUID, null),
      leafSchema(CHILD_B_CUID, null),
    ]);
    const root = hydratedRoot(schema);
    const top = topContainer(root);

    top.children = top.children.filter((child) => child.id !== CHILD_B_CUID);

    const result = diffComposeAxesAgainstOriginal(schema, root);

    expect(result).toEqual({ ok: false, reason: "structural-divergence" });
  });
});
