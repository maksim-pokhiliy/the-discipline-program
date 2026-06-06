"use client";

import { useCallback, useMemo, useState } from "react";

import type { RowKind } from "@repo/contracts/lms/schema-row";

import type { NodeHandlers } from "./components/compose-canvas-handlers";
import type { UpperHandlers } from "./components/compose-upper-handlers";
import { MOCK_SEED } from "./compose-mock-seed";
import type { ComposeContainer, ComposeNode, ComposeProgram, NodeId } from "./compose-tree.types";
import { makeNodeId } from "./lib/id-factory";
import { makeRow } from "./lib/make-row";
import { duplicateBlock, duplicateDay, duplicateSession, duplicateWeek } from "./lib/program-ops";
import { duplicateNodeAsSibling } from "./lib/sibling-ops";
import {
  findNodeInProgram,
  insertChildInProgram,
  moveChildInProgram,
  removeNodeFromProgram,
  updateNodeInProgram,
} from "./lib/tree-ops";

const emptyContainer = (): ComposeContainer => ({
  nodeType: "container",
  id: makeNodeId(),
  header: null,
  notes: null,
  children: [],
});

export type ComposeProgramController = {
  program: ComposeProgram;
  selectedNodeId: NodeId | null;
  selectedNode: ComposeNode | null;
  select: (id: NodeId) => void;
  clearSelection: () => void;
  updateNode: (id: NodeId, patch: (node: ComposeNode) => ComposeNode) => void;
  rename: (id: NodeId, header: string) => void;
  nodeHandlers: NodeHandlers;
  upperHandlers: UpperHandlers;
};

export const useComposeProgram = (
  initialProgram: ComposeProgram = MOCK_SEED,
): ComposeProgramController => {
  const [program, setProgram] = useState(initialProgram);
  const [selectedNodeId, setSelectedNodeId] = useState<NodeId | null>(null);

  const select = useCallback((id: NodeId) => setSelectedNodeId(id), []);
  const clearSelection = useCallback(() => setSelectedNodeId(null), []);

  const updateNode = useCallback(
    (id: NodeId, patch: (node: ComposeNode) => ComposeNode) =>
      setProgram((current) => updateNodeInProgram(current, id, patch)),
    [],
  );

  const rename = useCallback(
    (id: NodeId, header: string) =>
      updateNode(id, (node) =>
        node.nodeType === "container" ? { ...node, header: header === "" ? null : header } : node,
      ),
    [updateNode],
  );

  const duplicateNode = useCallback((id: NodeId) => {
    setProgram((current) => {
      const source = findNodeInProgram(current, id);

      return source === null ? current : duplicateNodeAsSibling(current, source);
    });
  }, []);

  const deleteNode = useCallback((id: NodeId) => {
    setProgram((current) => removeNodeFromProgram(current, id));
    setSelectedNodeId((current) => (current === id ? null : current));
  }, []);

  const reorderChildren = useCallback(
    (parentId: NodeId, fromIndex: number, toIndex: number) =>
      setProgram((current) => moveChildInProgram(current, parentId, fromIndex, toIndex)),
    [],
  );

  const addContainer = useCallback((parentId: NodeId) => {
    const node = emptyContainer();

    setProgram((current) => insertChildInProgram(current, parentId, node));
    setSelectedNodeId(node.id);
  }, []);

  const addRow = useCallback((parentId: NodeId, rowKind: RowKind) => {
    const node = makeRow(rowKind);

    setProgram((current) => insertChildInProgram(current, parentId, node));
    setSelectedNodeId(node.id);
  }, []);

  const selectedNode = useMemo(
    () => (selectedNodeId === null ? null : findNodeInProgram(program, selectedNodeId)),
    [program, selectedNodeId],
  );

  const nodeHandlers = useMemo<NodeHandlers>(
    () => ({
      selectedNodeId,
      isStructuralEditingAllowed: true,
      onSelect: select,
      onDuplicateNode: duplicateNode,
      onDeleteNode: deleteNode,
      onReorderChildren: reorderChildren,
      onAddContainer: addContainer,
      onAddRow: addRow,
    }),
    [selectedNodeId, select, duplicateNode, deleteNode, reorderChildren, addContainer, addRow],
  );

  const upperHandlers = useMemo<UpperHandlers>(
    () => ({
      onDuplicateBlock: (id) => setProgram((current) => duplicateBlock(current, id)),
      onDuplicateSession: (id) => setProgram((current) => duplicateSession(current, id)),
      onDuplicateDay: (id) => setProgram((current) => duplicateDay(current, id)),
      onDuplicateWeek: (id) => setProgram((current) => duplicateWeek(current, id)),
    }),
    [],
  );

  return {
    program,
    selectedNodeId,
    selectedNode,
    select,
    clearSelection,
    updateNode,
    rename,
    nodeHandlers,
    upperHandlers,
  };
};
