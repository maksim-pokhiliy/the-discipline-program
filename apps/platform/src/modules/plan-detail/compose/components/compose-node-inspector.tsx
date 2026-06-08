"use client";

import { Typography } from "@mui/material";

import type { Exercise } from "@repo/contracts/lms/exercise";

import { ContainerInspector } from "../../components/axes/container-inspector";
import type { ComposeNode, NodeId } from "../compose-tree.types";

import { ComposeLeafEditor } from "./compose-leaf-editor";

const EMPTY_TEXT = "Select a node to edit its axes.";

type ComposeNodeInspectorProps = {
  selectedNode: ComposeNode | null;
  exerciseById: Map<string, Exercise>;
  isCreateMode: boolean;
  updateNode: (id: NodeId, patch: (node: ComposeNode) => ComposeNode) => void;
  rename: (id: NodeId, header: string) => void;
  onDemoteNode?: ((id: NodeId) => void) | undefined;
};

export const ComposeNodeInspector: React.FC<ComposeNodeInspectorProps> = ({
  selectedNode,
  exerciseById,
  isCreateMode,
  updateNode,
  rename,
  onDemoteNode,
}) => {
  if (selectedNode === null) {
    return (
      <Typography variant="body2" color="text.subtle">
        {EMPTY_TEXT}
      </Typography>
    );
  }

  if (selectedNode.nodeType === "container") {
    return (
      <ContainerInspector
        key={selectedNode.id}
        container={selectedNode}
        exerciseById={exerciseById}
        isCreateMode={isCreateMode}
        onUpdateNode={updateNode}
        onRename={rename}
        onDemoteNode={onDemoteNode}
      />
    );
  }

  return <ComposeLeafEditor key={selectedNode.id} row={selectedNode} onUpdateNode={updateNode} />;
};
