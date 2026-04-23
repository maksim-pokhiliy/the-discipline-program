"use client";

import TimerIcon from "@mui/icons-material/Timer";
import { Box, Chip, Stack } from "@mui/material";
import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";

import { readEmomSlotAttrs, type EmomSlotNodeViewProps } from "./node-view-types";

export const EmomSlotView = ({ node, selected }: EmomSlotNodeViewProps) => {
  const { minuteInRound } = readEmomSlotAttrs(node.attrs);

  return (
    <NodeViewWrapper as="section">
      <Box
        sx={(theme) => ({
          my: 1,
          borderRadius: 1,
          border: 1,
          borderColor: selected ? "primary.main" : "divider",
          bgcolor: "background.default",
          transition: theme.transitions.create("border-color"),
        })}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{ px: 1.5, py: 0.75, borderBottom: 1, borderColor: "divider" }}
        >
          <Chip
            size="small"
            variant="outlined"
            icon={<TimerIcon fontSize="small" />}
            label={`Min ${minuteInRound}`}
          />
        </Stack>

        <Box sx={{ px: 1.5, py: 1 }}>
          <NodeViewContent as="div" />
        </Box>
      </Box>
    </NodeViewWrapper>
  );
};
