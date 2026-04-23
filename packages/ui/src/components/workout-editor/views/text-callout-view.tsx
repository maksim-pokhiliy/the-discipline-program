"use client";

import { Box } from "@mui/material";
import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";

import { readTextCalloutAttrs, type TextCalloutNodeViewProps } from "./node-view-types";

const toneColor = (tone: string): "info" | "warning" | "error" | "success" => {
  switch (tone) {
    case "warning":
      return "warning";
    case "error":
      return "error";
    case "success":
      return "success";
    default:
      return "info";
  }
};

export const TextCalloutView = ({ node, selected }: TextCalloutNodeViewProps) => {
  const { tone } = readTextCalloutAttrs(node.attrs);
  const color = toneColor(tone);

  return (
    <NodeViewWrapper as="section">
      <Box
        sx={(theme) => ({
          my: 1.5,
          px: 2,
          py: 1.5,
          borderLeft: 4,
          borderColor: `${color}.main`,
          bgcolor: `${color}.light`,
          borderRadius: 1,
          transition: theme.transitions.create("border-color"),
          outline: selected ? `1px solid ${theme.palette.primary.main}` : "none",
        })}
      >
        <NodeViewContent as="div" />
      </Box>
    </NodeViewWrapper>
  );
};
