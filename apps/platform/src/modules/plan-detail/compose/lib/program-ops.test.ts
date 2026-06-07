import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type {
  ComposeContainer,
  ComposeNode,
  ComposeProgram,
  ComposeRow,
} from "../compose-tree.types";
import { useComposeProgram } from "../use-compose-program";

import { asNodeId } from "./id-factory";
import { findNodeInProgram } from "./tree-ops";

const childIdsOf = (node: ComposeNode | null): string[] =>
  node !== null && node.nodeType === "container" ? node.children.map((child) => child.id) : [];

const demoteRow = (): ComposeRow => ({
  nodeType: "row",
  id: asNodeId("demote-row"),
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

const demoteContainer = (id: string, children: ComposeNode[]): ComposeContainer => ({
  nodeType: "container",
  id: asNodeId(id),
  header: null,
  notes: null,
  children,
});

const demotableProgram = (): ComposeProgram => ({
  weeks: [
    {
      id: asNodeId("demote-week"),
      label: "Week",
      days: [
        {
          id: asNodeId("demote-day"),
          label: "Day",
          sessions: [
            {
              id: asNodeId("demote-session"),
              label: "Session",
              blocks: [
                {
                  id: asNodeId("demote-block"),
                  label: "Block",
                  root: demoteContainer("demote-root", [
                    demoteContainer("demote-group", [demoteRow()]),
                  ]),
                },
              ],
            },
          ],
        },
      ],
    },
  ],
});

describe("useComposeProgram selection lifecycle on delete (QA-1)", () => {
  it("clears the selection when the selected node is deleted", () => {
    const { result } = renderHook(() => useComposeProgram());
    const target = asNodeId("block-d-kb");

    act(() => result.current.select(target));
    expect(result.current.selectedNodeId).toBe(target);

    act(() => result.current.nodeHandlers.onDeleteNode(target));

    expect(result.current.selectedNodeId).toBeNull();
    expect(result.current.selectedNode).toBeNull();
    expect(findNodeInProgram(result.current.program, target)).toBeNull();
  });

  it("self-heals to an empty inspector when an ancestor of the selection is deleted (QA-001)", () => {
    const { result } = renderHook(() => useComposeProgram());
    const leaf = asNodeId("block-c-ladder-down-row");
    const ancestor = asNodeId("block-c-ladder-down");

    act(() => result.current.select(leaf));
    act(() => result.current.nodeHandlers.onDeleteNode(ancestor));

    expect(result.current.selectedNodeId).toBe(leaf);
    expect(result.current.selectedNode).toBeNull();
    expect(findNodeInProgram(result.current.program, leaf)).toBeNull();
  });
});

describe("useComposeProgram block-root delete is a no-op (QA-002)", () => {
  it("leaves the block-root container and its children unchanged when delete is invoked on it", () => {
    const { result } = renderHook(() => useComposeProgram());
    const root = asNodeId("block-d-root");

    const before = childIdsOf(findNodeInProgram(result.current.program, root));

    act(() => result.current.nodeHandlers.onDeleteNode(root));

    const after = findNodeInProgram(result.current.program, root);

    expect(after?.nodeType).toBe("container");
    expect(childIdsOf(after)).toStrictEqual(before);
  });
});

describe("useComposeProgram duplicate-as-sibling (QA-6)", () => {
  it("inserts the clone at index+1 and keeps the source in place", () => {
    const { result } = renderHook(() => useComposeProgram());
    const parent = asNodeId("block-d-root");
    const source = asNodeId("block-d-kb");

    const before = childIdsOf(findNodeInProgram(result.current.program, parent));
    const sourceIndex = before.indexOf(source);

    act(() => result.current.nodeHandlers.onDuplicateNode(source));

    const after = childIdsOf(findNodeInProgram(result.current.program, parent));

    expect(after).toHaveLength(before.length + 1);
    expect(after[sourceIndex]).toBe(source);
    expect(after[sourceIndex + 1]).not.toBe(source);
    expect(new Set(after).size).toBe(after.length);
  });

  it("keeps the selection on the source, not the clone", () => {
    const { result } = renderHook(() => useComposeProgram());
    const parent = asNodeId("block-d-root");
    const source = asNodeId("block-d-kb");

    act(() => result.current.select(source));

    const sourceIndex = childIdsOf(findNodeInProgram(result.current.program, parent)).indexOf(
      source,
    );

    act(() => result.current.nodeHandlers.onDuplicateNode(source));

    const cloneId = childIdsOf(findNodeInProgram(result.current.program, parent))[sourceIndex + 1];

    expect(result.current.selectedNodeId).toBe(source);
    expect(result.current.selectedNodeId).not.toBe(cloneId);
  });
});

describe("useComposeProgram re-selects the surviving row after demote (T2-6, QA-T26-4)", () => {
  it("selects the unwrapped child row and drops the demoted container", () => {
    const { result } = renderHook(() => useComposeProgram(demotableProgram()));
    const group = asNodeId("demote-group");
    const childRow = asNodeId("demote-row");

    act(() => result.current.demoteNode(group));

    expect(result.current.selectedNodeId).toBe(childRow);
    expect(findNodeInProgram(result.current.program, group)).toBeNull();
    expect(findNodeInProgram(result.current.program, childRow)?.nodeType).toBe("row");
    expect(
      childIdsOf(findNodeInProgram(result.current.program, asNodeId("demote-root"))),
    ).toContain(childRow);
  });
});
