"use client";

import { Box, Chip, Stack, Typography } from "@mui/material";
import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";

import { readBlockAttrs, type BlockNodeViewProps } from "./node-view-types";

type BlockKindMeta = {
  label: string;
  color: "primary" | "secondary" | "info" | "warning" | "success";
};

const BLOCK_KIND_META: Record<string, BlockKindMeta> = {
  straightSets: { label: "Straight sets", color: "primary" },
  forTime: { label: "For time", color: "secondary" },
  amrap: { label: "AMRAP", color: "info" },
  emom: { label: "EMOM", color: "warning" },
  everyXMin: { label: "Every X min", color: "info" },
  intervals: { label: "Intervals", color: "info" },
  timeBlocks: { label: "Time blocks", color: "success" },
};

export const BlockNodeView = ({ node, selected }: BlockNodeViewProps) => {
  const meta = BLOCK_KIND_META[node.type.name] ?? { label: node.type.name, color: "primary" };
  const { effortPct, note } = readBlockAttrs(node.attrs);

  return (
    <NodeViewWrapper as="section">
      <Box
        sx={(theme) => ({
          my: 1.5,
          borderRadius: 1.5,
          border: 1,
          borderColor: selected ? "primary.main" : "divider",
          bgcolor: "background.paper",
          overflow: "hidden",
          transition: theme.transitions.create(["border-color", "box-shadow"]),
          boxShadow: selected ? 2 : 0,
        })}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{ px: 2, py: 1, borderBottom: 1, borderColor: "divider", bgcolor: "action.hover" }}
        >
          <Chip size="small" color={meta.color} label={meta.label} />

          {effortPct !== null && (
            <Chip size="small" variant="outlined" label={`${effortPct}% effort`} />
          )}

          {note !== null && note.length > 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
              {note}
            </Typography>
          )}
        </Stack>

        <Box sx={{ p: 1.5 }}>
          <NodeViewContent as="div" />
        </Box>
      </Box>
    </NodeViewWrapper>
  );
};
