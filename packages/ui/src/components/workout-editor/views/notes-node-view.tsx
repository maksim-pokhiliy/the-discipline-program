"use client";

import NotesIcon from "@mui/icons-material/StickyNote2";
import { Box, Chip, MenuItem, Select, Stack } from "@mui/material";
import { NodeViewContent, NodeViewWrapper, useEditorState } from "@tiptap/react";

import { readBlockTypes } from "../extensions/block-types";

import { readBlockAttrs, type NotesNodeViewProps } from "./node-view-types";

export const NotesNodeView = ({ editor, node, selected, updateAttributes }: NotesNodeViewProps) => {
  const { blockTypeId } = readBlockAttrs(node.attrs);
  const blockTypes = useEditorState({
    editor,
    selector: ({ editor: ctxEditor }) => readBlockTypes(ctxEditor),
  });

  return (
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
