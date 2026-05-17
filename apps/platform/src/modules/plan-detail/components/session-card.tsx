"use client";

import { useRef, useState } from "react";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import DeleteIcon from "@mui/icons-material/Delete";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { Box, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Stack } from "@mui/material";

import type { SessionWithLabel } from "@repo/contracts/lms/day";
import type { Label } from "@repo/contracts/lms/label";
import { ConfirmationModal } from "@repo/ui";

import { useDeleteSession, useUpdateSession } from "@app/lib/hooks";

import { SessionLabelSelect } from "./session-label-select";
import { SessionNotesField } from "./session-notes-field";

type SessionCardProps = {
  session: SessionWithLabel;
  planId: string;
  startDate: string;
  sessionLabelOptions: Label[];
  sessionLabelOptionsLoading: boolean;
};

export const SessionCard: React.FC<SessionCardProps> = ({
  session,
  planId,
  startDate,
  sessionLabelOptions,
  sessionLabelOptionsLoading,
}) => {
  const updateSession = useUpdateSession(planId, startDate);
  const deleteSession = useDeleteSession(planId, startDate);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: session.id,
    disabled: updateSession.isPending || deleteSession.isPending,
  });

  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);

  const handleLabelChange = (labelId: string | null) =>
    updateSession.mutate({ sessionId: session.id, data: { labelId } });

  const handleNotesCommit = (notes: string | null) =>
    updateSession.mutate({ sessionId: session.id, data: { notes } });

  const handleDeleteConfirm = () => {
    deleteSession.mutate({ sessionId: session.id }, { onSuccess: () => setDeleteOpen(false) });
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      sx={{
        p: 1.5,
        border: 1,
        borderColor: "divider",
        borderRadius: 1,
        bgcolor: "background.paper",
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        <IconButton
          {...attributes}
          {...listeners}
          size="small"
          aria-label="Drag session"
          sx={{ cursor: "grab", touchAction: "none" }}
        >
          <DragIndicatorIcon fontSize="small" />
        </IconButton>

        <Box sx={{ width: 240, flexShrink: 0 }}>
          <SessionLabelSelect
            value={session.label}
            options={sessionLabelOptions}
            isLoading={sessionLabelOptionsLoading}
            onChange={handleLabelChange}
          />
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <SessionNotesField value={session.notes} onCommit={handleNotesCommit} />
        </Box>

        <IconButton
          ref={anchorRef}
          onClick={() => setMenuOpen(true)}
          aria-label="Session actions"
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
        title="Delete session"
        type="danger"
        message="Delete this session?"
        details={session.label?.name ?? "Empty session"}
        onConfirm={handleDeleteConfirm}
        isConfirming={deleteSession.isPending}
      />
    </Box>
  );
};
