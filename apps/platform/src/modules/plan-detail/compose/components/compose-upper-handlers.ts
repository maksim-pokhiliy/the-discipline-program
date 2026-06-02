import type { NodeId } from "../compose-tree.types";

export type UpperHandlers = {
  onDuplicateBlock: (id: NodeId) => void;
  onDuplicateSession: (id: NodeId) => void;
  onDuplicateDay: (id: NodeId) => void;
  onDuplicateWeek: (id: NodeId) => void;
};
