"use client";

import { Typography } from "@mui/material";

import type { ComposeNode, NodeId } from "../compose-tree.types";

import { ComposeContainerInspector } from "./compose-container-inspector";
import { ComposeLeafEditor } from "./compose-leaf-editor";

const EMPTY_TEXT = "Select a node to edit its axes.";

type ComposeNodeInspectorProps = {
  selectedNode: ComposeNode | null;
  updateNode: (id: NodeId, patch: (node: ComposeNode) => ComposeNode) => void;
  rename: (id: NodeId, header: string) => void;
};

export const ComposeNodeInspector: React.FC<ComposeNodeInspectorProps> = ({
  selectedNode,
  updateNode,
  rename,
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
      <ComposeContainerInspector
        key={selectedNode.id}
        container={selectedNode}
        onUpdateNode={updateNode}
        onRename={rename}
      />
    );
  }

  return <ComposeLeafEditor key={selectedNode.id} row={selectedNode} onUpdateNode={updateNode} />;
};
