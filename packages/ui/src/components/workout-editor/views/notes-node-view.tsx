"use client";

import NotesIcon from "@mui/icons-material/StickyNote2";
import { Box, Chip, Stack } from "@mui/material";
import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";

import type { NotesNodeViewProps } from "./node-view-types";

export const NotesNodeView = ({ selected }: NotesNodeViewProps) => (
  <NodeViewWrapper as="section">
    <Box
      sx={(theme) => ({
        my: 1.5,
        borderRadius: 1.5,
        border: 1,
        borderColor: selected ? "primary.main" : "divider",
        bgcolor: "background.paper",
        transition: theme.transitions.create("border-color"),
      })}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        sx={{ px: 2, py: 1, borderBottom: 1, borderColor: "divider", bgcolor: "action.hover" }}
      >
        <Chip size="small" icon={<NotesIcon fontSize="small" />} label="Notes" />
      </Stack>

      <Box sx={{ px: 2, py: 1.5 }}>
        <NodeViewContent as="div" />
      </Box>
    </Box>
  </NodeViewWrapper>
);
