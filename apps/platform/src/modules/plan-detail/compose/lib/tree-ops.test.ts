import { describe, expect, it } from "vitest";

import type {
  ArrangementAxis,
  ComposeContainer,
  ComposeNode,
  ComposeRow,
  NodeId,
} from "../compose-tree.types";

import { asNodeId } from "./id-factory";
import {
  cloneBlock,
  cloneNode,
  findNode,
  insertChild,
  moveChild,
  removeNode,
  updateNode,
} from "./tree-ops";

const REST_PAYLOAD = {
  rowKind: "REST_SLOT" as const,
};

const makeRow = (id: string): ComposeRow => ({
  nodeType: "row",
  id: asNodeId(id),
  rowKind: "REST_SLOT",
  rowPayload: REST_PAYLOAD,
  reps: null,
  load: null,
  side: null,
  tempo: null,
  position: null,
  intensity: null,
  notes: null,
  editorDraft: { notes: "" },
});

const makeContainer = (id: string, children: ComposeNode[]): ComposeContainer => ({
  nodeType: "container",
  id: asNodeId(id),
  header: null,
  notes: null,
  children,
});

const collectIds = (node: ComposeNode): NodeId[] => {
  if (node.nodeType === "row") {
    return [node.id];
  }

  return [node.id, ...node.children.flatMap(collectIds)];
};

const childIds = (container: ComposeContainer): NodeId[] =>
  container.children.map((child) => child.id);

const nested = (): ComposeContainer =>
  makeContainer("root", [
    makeRow("a"),
    makeContainer("group", [makeRow("b"), makeRow("c")]),
    makeRow("d"),
  ]);

describe("findNode", () => {
  it("returns the node when the id exists at any depth", () => {
    const root = nested();

    expect(findNode(root, asNodeId("c"))?.id).toBe(asNodeId("c"));
  });

  it("returns null when the id is absent", () => {
    expect(findNode(nested(), asNodeId("missing"))).toBeNull();
  });
});

describe("cloneNode", () => {
  it("regenerates a fresh id at every level so source and clone share none", () => {
    const root = nested();
    const clone = cloneNode(root);

    const sourceIds = new Set(collectIds(root));
    const cloneIds = collectIds(clone);

    expect(cloneIds).toHaveLength(sourceIds.size);
    expect(cloneIds.every((id) => !sourceIds.has(id))).toBe(true);
  });

  it("preserves the structure and leaf payloads of the source", () => {
    const clone = cloneNode(nested());

    expect(clone.nodeType).toBe("container");

    if (clone.nodeType === "container") {
      expect(clone.children).toHaveLength(3);
      expect(clone.children[1]?.nodeType).toBe("container");
    }
  });

  it("does not mutate the source tree", () => {
    const root = nested();
    const before = collectIds(root);

    cloneNode(root);

    expect(collectIds(root)).toStrictEqual(before);
  });

  it("deep-copies leaf editorDraft so mutating the source leaves the clone untouched (QA-2.3)", () => {
    const source = makeRow("src");
    const clone = cloneNode(source);

    (source.editorDraft as { notes: string }).notes = "mutated after clone";

    expect(clone.nodeType).toBe("row");

    if (clone.nodeType === "row") {
      expect(clone.editorDraft).toStrictEqual({ notes: "" });
    }
  });
});

describe("insertChild", () => {
  it("appends to the parent when no index is given", () => {
    const next = insertChild(nested(), asNodeId("root"), makeRow("z"));

    expect(next.nodeType).toBe("container");

    if (next.nodeType === "container") {
      expect(childIds(next)).toStrictEqual([
        asNodeId("a"),
        asNodeId("group"),
        asNodeId("d"),
        asNodeId("z"),
      ]);
    }
  });

  it("inserts at the given index and leaves siblings intact", () => {
    const next = insertChild(nested(), asNodeId("root"), makeRow("z"), 1);

    if (next.nodeType === "container") {
      expect(childIds(next)).toStrictEqual([
        asNodeId("a"),
        asNodeId("z"),
        asNodeId("group"),
        asNodeId("d"),
      ]);
    }
  });

  it("does not mutate the source tree", () => {
    const root = nested();

    insertChild(root, asNodeId("root"), makeRow("z"));

    expect(childIds(root)).toStrictEqual([asNodeId("a"), asNodeId("group"), asNodeId("d")]);
  });
});

describe("removeNode", () => {
  it("removes a nested node and preserves the rest of the tree", () => {
    const next = removeNode(nested(), asNodeId("b"));
    const group = findNode(next, asNodeId("group"));

    expect(group?.nodeType).toBe("container");

    if (group?.nodeType === "container") {
      expect(childIds(group)).toStrictEqual([asNodeId("c")]);
    }

    expect(findNode(next, asNodeId("a"))).not.toBeNull();
    expect(findNode(next, asNodeId("d"))).not.toBeNull();
  });

  it("does not mutate the source tree", () => {
    const root = nested();

    removeNode(root, asNodeId("b"));

    expect(collectIds(root)).toContain(asNodeId("b"));
  });
});

describe("moveChild", () => {
  it("reorders within a single parent", () => {
    const next = moveChild(nested(), asNodeId("root"), 0, 2);

    if (next.nodeType === "container") {
      expect(childIds(next)).toStrictEqual([asNodeId("group"), asNodeId("d"), asNodeId("a")]);
    }
  });

  it("does not mutate the source tree", () => {
    const root = nested();

    moveChild(root, asNodeId("root"), 0, 2);

    expect(childIds(root)).toStrictEqual([asNodeId("a"), asNodeId("group"), asNodeId("d")]);
  });
});

describe("updateNode", () => {
  it("replaces only the targeted node", () => {
    const next = updateNode(nested(), asNodeId("a"), (node) => ({ ...node, notes: "touched" }));
    const target = findNode(next, asNodeId("a"));
    const sibling = findNode(next, asNodeId("d"));

    expect(target?.notes).toBe("touched");
    expect(sibling?.notes).toBeNull();
  });

  it("does not mutate the source tree", () => {
    const root = nested();

    updateNode(root, asNodeId("a"), (node) => ({ ...node, notes: "touched" }));

    expect(findNode(root, asNodeId("a"))?.notes).toBeNull();
  });
});

describe("cloneBlock", () => {
  it("regenerates every node id in the block subtree", () => {
    const source = { id: asNodeId("block-1"), label: "Block", root: nested() };
    const clone = cloneBlock(source);

    const sourceIds = new Set([source.id, ...collectIds(source.root)]);
    const cloneIds = [clone.id, ...collectIds(clone.root)];

    expect(clone.label).toBe("Block");
    expect(cloneIds.every((id) => !sourceIds.has(id))).toBe(true);
  });
});

const trackContainer = (id: string, rowIds: string[]): ComposeContainer =>
  makeContainer(id, rowIds.map(makeRow));

const withArrangement = (
  container: ComposeContainer,
  arrangement: ArrangementAxis,
): ComposeContainer => ({ ...container, arrangement });

const parallelSource = (): ComposeContainer =>
  withArrangement(
    makeContainer("parallel-root", [
      trackContainer("track-down", ["track-down-row"]),
      trackContainer("track-up", ["track-up-row"]),
    ]),
    {
      kind: "parallel",
      interleaveOrder: "round_by_round",
      tracks: [
        { childSchemaId: asNodeId("track-down"), setEnumeration: [21, 15, 9] },
        { childSchemaId: asNodeId("track-up"), pairedWithRowId: asNodeId("track-down-row") },
      ],
    },
  );

const supersetSource = (): ComposeContainer =>
  withArrangement(makeContainer("superset-root", [makeRow("row-curl"), makeRow("row-ext")]), {
    kind: "superset",
    pairs: [{ label: "Biceps / triceps", rowIds: [asNodeId("row-curl"), asNodeId("row-ext")] }],
  });

const asContainer = (node: ComposeNode | undefined): ComposeContainer => {
  if (node === undefined || node.nodeType !== "container") {
    throw new Error("expected a container clone");
  }

  return node;
};

const parallelOf = (
  container: ComposeContainer,
): Extract<ArrangementAxis, { kind: "parallel" }> => {
  if (container.arrangement?.kind !== "parallel") {
    throw new Error("expected a parallel arrangement");
  }

  return container.arrangement;
};

const supersetOf = (
  container: ComposeContainer,
): Extract<ArrangementAxis, { kind: "superset" }> => {
  if (container.arrangement?.kind !== "superset") {
    throw new Error("expected a superset arrangement");
  }

  return container.arrangement;
};

describe("cloneNode arrangement-ref remap (QA-503)", () => {
  it("remaps a parallel container's track refs to the clone's own child and row ids (B5-AC)", () => {
    const source = parallelSource();
    const clone = asContainer(cloneNode(source));

    const sourceIds = new Set(collectIds(source));
    const cloneChildIds = new Set(childIds(clone));
    const cloneRowIds = new Set(clone.children.flatMap(collectIds));
    const tracks = parallelOf(clone).tracks;

    for (const track of tracks) {
      expect(cloneChildIds.has(track.childSchemaId)).toBe(true);
      expect(sourceIds.has(track.childSchemaId)).toBe(false);
    }

    const pairedRow = tracks[1]?.pairedWithRowId;

    expect(pairedRow).toBeDefined();

    if (pairedRow !== undefined) {
      expect(cloneRowIds.has(pairedRow)).toBe(true);
      expect(sourceIds.has(pairedRow)).toBe(false);
    }

    expect(tracks[0]?.setEnumeration).toEqual([21, 15, 9]);
  });

  it("remaps a superset container's pair rowIds to the clone's own row ids (B5-AC)", () => {
    const source = supersetSource();
    const clone = asContainer(cloneNode(source));

    const sourceIds = new Set(collectIds(source));
    const cloneRowIds = new Set(childIds(clone));
    const pair = supersetOf(clone).pairs[0];

    expect(pair?.rowIds).toHaveLength(2);

    for (const rowId of pair?.rowIds ?? []) {
      expect(cloneRowIds.has(rowId)).toBe(true);
      expect(sourceIds.has(rowId)).toBe(false);
    }
  });

  it("keeps parallel refs internally consistent across a clone-of-clone (B5-AC)", () => {
    const firstClone = asContainer(cloneNode(parallelSource()));
    const secondClone = asContainer(cloneNode(firstClone));

    const firstCloneIds = new Set(collectIds(firstClone));
    const secondChildIds = new Set(childIds(secondClone));
    const secondRowIds = new Set(secondClone.children.flatMap(collectIds));
    const tracks = parallelOf(secondClone).tracks;

    for (const track of tracks) {
      expect(secondChildIds.has(track.childSchemaId)).toBe(true);
      expect(firstCloneIds.has(track.childSchemaId)).toBe(false);
    }

    const pairedRow = tracks[1]?.pairedWithRowId;

    if (pairedRow !== undefined) {
      expect(secondRowIds.has(pairedRow)).toBe(true);
      expect(firstCloneIds.has(pairedRow)).toBe(false);
    }
  });

  it("remaps both levels of a parallel-inside-parallel clone (B5-AC)", () => {
    const innerParallel = withArrangement(
      makeContainer("inner-parallel", [
        trackContainer("inner-a", ["inner-a-row"]),
        trackContainer("inner-b", ["inner-b-row"]),
      ]),
      {
        kind: "parallel",
        interleaveOrder: "track_by_track",
        tracks: [{ childSchemaId: asNodeId("inner-a") }, { childSchemaId: asNodeId("inner-b") }],
      },
    );
    const outer = withArrangement(
      makeContainer("outer-parallel", [innerParallel, trackContainer("outer-b", ["outer-b-row"])]),
      {
        kind: "parallel",
        interleaveOrder: "round_by_round",
        tracks: [
          { childSchemaId: asNodeId("inner-parallel") },
          { childSchemaId: asNodeId("outer-b") },
        ],
      },
    );

    const clone = asContainer(cloneNode(outer));
    const sourceIds = new Set(collectIds(outer));

    const outerTracks = parallelOf(clone).tracks;
    const outerChildIds = new Set(childIds(clone));

    for (const track of outerTracks) {
      expect(outerChildIds.has(track.childSchemaId)).toBe(true);
      expect(sourceIds.has(track.childSchemaId)).toBe(false);
    }

    const clonedInner = asContainer(clone.children[0]);
    const innerTracks = parallelOf(clonedInner).tracks;
    const innerChildIds = new Set(childIds(clonedInner));

    for (const track of innerTracks) {
      expect(innerChildIds.has(track.childSchemaId)).toBe(true);
      expect(sourceIds.has(track.childSchemaId)).toBe(false);
    }
  });
});
