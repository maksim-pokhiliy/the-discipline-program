import type { RowKind } from "@repo/contracts/lms/schema-row";

import type { NodeId } from "../compose-tree.types";

export type NodeHandlers = {
  selectedNodeId: NodeId | null;
  isStructuralEditingAllowed: boolean;
  onSelect: (id: NodeId) => void;
  onDuplicateNode: (id: NodeId) => void;
  onDeleteNode: (id: NodeId) => void;
  onReorderChildren: (parentId: NodeId, fromIndex: number, toIndex: number) => void;
  onAddContainer: (parentId: NodeId) => void;
  onAddRow: (parentId: NodeId, rowKind: RowKind) => void;
};
