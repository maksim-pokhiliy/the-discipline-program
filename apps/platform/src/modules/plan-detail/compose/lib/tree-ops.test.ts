import { describe, expect, it } from "vitest";

import type { ComposeContainer, ComposeNode, ComposeRow, NodeId } from "../compose-tree.types";

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
