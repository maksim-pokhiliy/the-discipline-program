"use client";

import TuneIcon from "@mui/icons-material/Tune";
import { Chip } from "@mui/material";
import { NodeViewWrapper } from "@tiptap/react";

import { readSchemeMentionAttrs, type SchemeMentionNodeViewProps } from "./node-view-types";

export const SchemeMentionView = ({ node, selected }: SchemeMentionNodeViewProps) => {
  const { label, schemeId } = readSchemeMentionAttrs(node.attrs);
  const display = label ?? "Scheme";

  return (
    <NodeViewWrapper as="span" style={{ display: "inline-flex" }}>
      <Chip
        size="small"
        variant={selected ? "filled" : "outlined"}
        icon={<TuneIcon fontSize="small" />}
        color={schemeId === null ? "warning" : "primary"}
        label={display}
        sx={{ mx: 0.25 }}
      />
    </NodeViewWrapper>
  );
};
