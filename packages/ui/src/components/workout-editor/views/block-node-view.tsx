"use client";

import { Box, Chip, MenuItem, Select, Stack, Typography } from "@mui/material";
import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";

import { readBlockTypes } from "../extensions/block-types";

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

export const BlockNodeView = ({ editor, node, selected, updateAttributes }: BlockNodeViewProps) => {
  const meta = BLOCK_KIND_META[node.type.name] ?? { label: node.type.name, color: "primary" };
  const { blockTypeId, effortPct, note } = readBlockAttrs(node.attrs);
  const blockTypes = readBlockTypes(editor);

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

          <Select
            size="small"
            value={blockTypeId ?? ""}
            onChange={(event) => updateAttributes({ blockTypeId: event.target.value })}
            displayEmpty
            renderValue={(value) => {
              const selected = blockTypes.find((bt) => bt.id === value);

              return selected ? selected.name : "Select type";
            }}
            sx={{ minWidth: 140, "& .MuiSelect-select": { py: 0.5 } }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            {blockTypes.map((bt) => (
              <MenuItem key={bt.id} value={bt.id}>
                {bt.name}
              </MenuItem>
            ))}
          </Select>

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
