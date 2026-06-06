import { describe, expect, it } from "vitest";

import type { StagedProgramKind } from "@repo/contracts/lms/_shared";
import type { Composition } from "@repo/contracts/lms/composition";
import { compositionSchema } from "@repo/contracts/lms/composition";
import type { SchemaWithBody } from "@repo/contracts/lms/schema";

import type { ComposeContainer } from "../compose-tree.types";

import { composeContainerToComposition } from "./compose-to-create-requests";
import { diffComposeAxesAgainstOriginal } from "./diff-compose-axes";
import { asNodeId } from "./id-factory";
import { schemaWithBodyToComposeContainer } from "./schema-to-compose";

const EPOCH = new Date(0);
const TOP_CUID = "ckprogramkindtopaaaaaaaaa";
const BLOCK_CUID = "ckprogramkindblockaaaaaaa";
const DRAFT_CUID = "ckprogramkinddraftaaaaaaa";
const NESTED_CUID = "ckprogramkindnestedaaaaaa";

const seededComposition: Composition = {
  repetition: { kind: "count", count: 3 },
  programKind: "wave",
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

const nestedSubSchema = (composition: Composition): SchemaWithBody => ({
  schema: {
    id: NESTED_CUID,
    blockId: BLOCK_CUID,
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

const schemaWithNestedComposition = (top: Composition, nested: Composition): SchemaWithBody => ({
  ...schemaWithComposition(top),
  subSchemas: [nestedSubSchema(nested)],
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

const nestedContainer = (top: ComposeContainer, id: string): ComposeContainer => {
  const nested = top.children.find(
    (node): node is ComposeContainer => node.nodeType === "container" && node.id === id,
  );

  if (nested === undefined) {
    throw new Error(`missing nested container ${id}`);
  }

  return nested;
};

const withoutProgramKind = ({
  programKind: _previous,
  ...rest
}: ComposeContainer): ComposeContainer => rest;

const draftContainer = (programKind: StagedProgramKind): ComposeContainer => ({
  nodeType: "container",
  id: asNodeId(DRAFT_CUID),
  header: null,
  notes: null,
  repetition: { kind: "count", count: 3 },
  programKind,
  children: [],
});

describe("diffComposeAxesAgainstOriginal carries programKind through an editable round-trip", () => {
  it("survives an unrelated repetition edit (invariant #1, the no-flatten regression)", () => {
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
    expect(result.updates[0]?.composition).toEqual({
      repetition: { kind: "count", count: 5 },
      programKind: "wave",
    });
  });

  it("persists an edited programKind value (invariant #2, wave → cluster)", () => {
    const schema = seededSchema();
    const root = hydratedRoot(schema);
    const top = topContainer(root);

    top.programKind = "cluster";

    const result = diffComposeAxesAgainstOriginal(schema, root);

    expect(result.ok).toBe(true);

    if (!result.ok) {
      return;
    }

    expect(result.updates).toHaveLength(1);
    expect(result.updates[0]?.composition?.programKind).toBe("cluster");
  });

  it("persists a cleared programKind value (invariant #3, wave → none)", () => {
    const schema = seededSchema();
    const root = hydratedRoot(schema);

    root.children = [withoutProgramKind(topContainer(root))];

    const result = diffComposeAxesAgainstOriginal(schema, root);

    expect(result.ok).toBe(true);

    if (!result.ok) {
      return;
    }

    expect(result.updates).toHaveLength(1);
    expect(result.updates[0]?.composition).not.toHaveProperty("programKind");
  });
});

describe("diffComposeAxesAgainstOriginal carries programKind through a NESTED container (QA-004)", () => {
  const nestedSchema = (): SchemaWithBody =>
    schemaWithNestedComposition(
      { repetition: { kind: "count", count: 4 } },
      { repetition: { kind: "count", count: 3 }, programKind: "wave" },
    );

  it("preserves a nested container's programKind when its own unrelated axis is edited", () => {
    const schema = nestedSchema();
    const root = hydratedRoot(schema);
    const nested = nestedContainer(topContainer(root), NESTED_CUID);

    nested.repetition = { kind: "count", count: 5 };

    const result = diffComposeAxesAgainstOriginal(schema, root);

    expect(result.ok).toBe(true);

    if (!result.ok) {
      return;
    }

    expect(result.updates).toHaveLength(1);
    expect(result.updates[0]?.schemaId).toBe(NESTED_CUID);
    expect(result.updates[0]?.composition).toEqual({
      repetition: { kind: "count", count: 5 },
      programKind: "wave",
    });
  });

  it("persists an edited programKind on the nested container (wave → cluster at depth)", () => {
    const schema = nestedSchema();
    const root = hydratedRoot(schema);
    const nested = nestedContainer(topContainer(root), NESTED_CUID);

    nested.programKind = "cluster";

    const result = diffComposeAxesAgainstOriginal(schema, root);

    expect(result.ok).toBe(true);

    if (!result.ok) {
      return;
    }

    expect(result.updates).toHaveLength(1);
    expect(result.updates[0]?.schemaId).toBe(NESTED_CUID);
    expect(result.updates[0]?.composition?.programKind).toBe("cluster");
  });

  it("preserves a nested container's programKind when only the top container is edited", () => {
    const schema = nestedSchema();
    const root = hydratedRoot(schema);

    topContainer(root).repetition = { kind: "count", count: 6 };

    const result = diffComposeAxesAgainstOriginal(schema, root);

    expect(result.ok).toBe(true);

    if (!result.ok) {
      return;
    }

    expect(result.updates).toHaveLength(1);
    expect(result.updates[0]?.schemaId).toBe(TOP_CUID);
    expect(nestedContainer(topContainer(root), NESTED_CUID).programKind).toBe("wave");
  });
});

describe("composeContainerToComposition emits programKind on the create wire", () => {
  it("spreads a draft programKind into a composition that parses under the contract", () => {
    const composition = composeContainerToComposition(draftContainer("wave"));

    expect(composition.programKind).toBe("wave");
    expect(compositionSchema.safeParse(composition).success).toBe(true);
  });
});
