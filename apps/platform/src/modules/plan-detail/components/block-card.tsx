"use client";

import { useRef, useState } from "react";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import DeleteIcon from "@mui/icons-material/Delete";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { Box, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Stack } from "@mui/material";

import type { Block } from "@repo/contracts/lms/block";
import { ConfirmationModal } from "@repo/ui";

import { useAssignBlockLabels, useDeleteBlock, useUpdateBlock } from "@app/lib/hooks";

import { BlockLabelSelect } from "./block-label-select";
import { BlockNotesField } from "./block-notes-field";

type BlockCardProps = {
  block: Block;
  planId: string;
  startDate: string;
};

export const BlockCard: React.FC<BlockCardProps> = ({ block, planId, startDate }) => {
  const updateBlock = useUpdateBlock(planId, startDate);
  const deleteBlock = useDeleteBlock(planId, startDate);
  const assignLabels = useAssignBlockLabels(planId, startDate);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
    disabled: updateBlock.isPending || deleteBlock.isPending || assignLabels.isPending,
  });

  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);

  const handleLabelsChange = (labelIds: string[]) =>
    assignLabels.mutate({ blockId: block.id, data: { labelIds } });

  const handleNotesCommit = (notes: string | null) =>
    updateBlock.mutate({ blockId: block.id, data: { notes } });

  const handleDeleteConfirm = () => {
    deleteBlock.mutate({ blockId: block.id }, { onSuccess: () => setDeleteOpen(false) });
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const deleteDetails =
    block.labels.length > 0 ? block.labels.map((l) => l.name).join(", ") : "Empty block";

  return (
    <Box
      ref={setNodeRef}
      style={style}
      sx={{
        p: 1.5,
        border: 1,
        borderColor: "divider",
        borderRadius: 1,
        bgcolor: "background.default",
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        <IconButton
          {...attributes}
          {...listeners}
          size="small"
          aria-label="Drag block"
          sx={{ cursor: "grab", touchAction: "none" }}
        >
          <DragIndicatorIcon fontSize="small" />
        </IconButton>

        <Box sx={{ width: 240, flexShrink: 0 }}>
          <BlockLabelSelect value={block.labels} onChange={handleLabelsChange} />
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <BlockNotesField value={block.notes} onCommit={handleNotesCommit} />
        </Box>

        <IconButton
          ref={anchorRef}
          onClick={() => setMenuOpen(true)}
          aria-label="Block actions"
          size="small"
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
      </Stack>

      <Menu anchorEl={anchorRef.current} open={menuOpen} onClose={() => setMenuOpen(false)}>
        <MenuItem
          onClick={() => {
            setMenuOpen(false);
            setDeleteOpen(true);
          }}
          sx={{ color: "error.main" }}
        >
          <ListItemIcon sx={{ color: "inherit" }}>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      <ConfirmationModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete block"
        type="danger"
        message="Delete this block?"
        details={deleteDetails}
        onConfirm={handleDeleteConfirm}
        isConfirming={deleteBlock.isPending}
      />
    </Box>
  );
};
