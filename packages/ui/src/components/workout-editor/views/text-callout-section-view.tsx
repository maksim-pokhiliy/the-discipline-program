"use client";

import { memo, type CSSProperties } from "react";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import { Box, Chip, IconButton, Stack } from "@mui/material";
import { NodeViewContent, NodeViewWrapper, type NodeViewProps } from "@tiptap/react";

import { readTextCalloutSectionAttrs } from "./node-view-types";
import { useSectionSortableId } from "./use-section-sortable-id";

const toneToColor = (tone: string): "info" | "warning" | "error" | "success" => {
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

const TextCalloutSectionViewImpl = ({
  editor,
  node,
  selected,
  getPos,
  deleteNode,
}: NodeViewProps) => {
  const attrs = readTextCalloutSectionAttrs(node.attrs);
  const color = toneToColor(attrs.tone);
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
            color={color}
            label={attrs.tone}
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

export const TextCalloutSectionView = memo(TextCalloutSectionViewImpl);
