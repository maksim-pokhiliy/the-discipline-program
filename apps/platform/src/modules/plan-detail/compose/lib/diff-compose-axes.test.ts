import { describe, expect, it } from "vitest";

import type { Composition } from "@repo/contracts/lms/composition";
import type { SchemaWithBody } from "@repo/contracts/lms/schema";

import type { ComposeContainer } from "../compose-tree.types";

import { diffComposeAxesAgainstOriginal } from "./diff-compose-axes";
import { asNodeId } from "./id-factory";
import { schemaWithBodyToComposeContainer } from "./schema-to-compose";

const EPOCH = new Date(0);
const TOP_CUID = "ckdifftopaaaaaaaaaaaaaaaa";
const CHILD_A_CUID = "ckdiffchildaaaaaaaaaaaaaa";
const CHILD_B_CUID = "ckdiffchildbbbbbbbbbbbbbb";

const leafSchema = (id: string, composition: Composition | null): SchemaWithBody => ({
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
  rows: [],
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
