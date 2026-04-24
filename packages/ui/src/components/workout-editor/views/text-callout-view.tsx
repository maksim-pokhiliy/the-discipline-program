"use client";

import { Box, Chip, MenuItem, Select, Stack } from "@mui/material";
import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";

import { readBlockTypes } from "../extensions/block-types";

import {
  readBlockAttrs,
  readTextCalloutAttrs,
  type TextCalloutNodeViewProps,
} from "./node-view-types";

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

export const TextCalloutView = ({
  editor,
  node,
  selected,
  updateAttributes,
}: TextCalloutNodeViewProps) => {
  const { tone } = readTextCalloutAttrs(node.attrs);
  const { blockTypeId } = readBlockAttrs(node.attrs);
  const color = toneColor(tone);
  const blockTypes = readBlockTypes(editor);

  return (
    <NodeViewWrapper as="section">
      <Box
        sx={(theme) => ({
          my: 1.5,
          borderLeft: 4,
          borderColor: `${color}.main`,
          bgcolor: `${color}.light`,
          borderRadius: 1,
          overflow: "hidden",
          transition: theme.transitions.create("border-color"),
          outline: selected ? `1px solid ${theme.palette.primary.main}` : "none",
        })}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{
            px: 2,
            py: 1,
            borderBottom: 1,
            borderColor: "divider",
            bgcolor: "action.hover",
          }}
        >
          <Chip size="small" color={color} label={tone} />

          <Select
            size="small"
            value={blockTypeId ?? ""}
            onChange={(event) => updateAttributes({ blockTypeId: event.target.value })}
            displayEmpty
            renderValue={(value) => {
              const selectedBlockType = blockTypes.find((bt) => bt.id === value);

              return selectedBlockType ? selectedBlockType.name : "Select type";
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
        </Stack>

        <Box sx={{ px: 2, py: 1.5 }}>
          <NodeViewContent as="div" />
        </Box>
      </Box>
    </NodeViewWrapper>
  );
};
