"use client";

import { memo, type CSSProperties } from "react";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import NotesIcon from "@mui/icons-material/StickyNote2";
import { Box, Chip, IconButton, Stack } from "@mui/material";
import { NodeViewContent, NodeViewWrapper, type NodeViewProps } from "@tiptap/react";

import { useSectionSortableId } from "./use-section-sortable-id";

const NotesSectionViewImpl = ({ editor, selected, getPos, deleteNode }: NodeViewProps) => {
  const sortableId = useSectionSortableId(editor, getPos);
  const {
    setNodeRef,
    attributes: dndAttributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sortableId });

  const wrapperStyle: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <NodeViewWrapper as="section" ref={setNodeRef} style={wrapperStyle} {...dndAttributes}>
      <Box
        sx={(theme) => ({
          my: 1,
          borderRadius: 1.25,
          border: 1,
          borderColor: selected ? "primary.main" : "divider",
          bgcolor: "background.default",
          overflow: "hidden",
          transition: theme.transitions.create("border-color"),
        })}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{ px: 1.5, py: 0.75, borderBottom: 1, borderColor: "divider" }}
        >
          <IconButton
            size="small"
            aria-label="Reorder section"
            sx={{ cursor: "grab", touchAction: "none" }}
            onMouseDown={(event) => event.stopPropagation()}
            {...listeners}
          >
            <DragIndicatorIcon fontSize="small" />
          </IconButton>

          <Chip
            size="small"
            icon={<NotesIcon fontSize="small" />}
            label="Notes"
            onMouseDown={(event) => event.stopPropagation()}
          />

          <Box sx={{ flexGrow: 1 }} />

          <IconButton
            size="small"
            aria-label="Delete section"
            onClick={deleteNode}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Stack>

        <Box sx={{ px: 1.5, py: 1 }}>
          <NodeViewContent as="div" />
        </Box>
      </Box>
    </NodeViewWrapper>
  );
};

export const NotesSectionView = memo(NotesSectionViewImpl);
