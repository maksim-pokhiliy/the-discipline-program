"use client";

import { useRef, useState } from "react";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import DeleteIcon from "@mui/icons-material/Delete";
import { ListItemIcon, ListItemText, Menu, MenuItem, Stack } from "@mui/material";

import type { SessionWithLabel } from "@repo/contracts/lms/day";
import { ConfirmationModal } from "@repo/ui";

import { useDeleteSession, useUpdateSession } from "@app/lib/hooks";

import { BlockList } from "./block-list";
import { SessionCardHead } from "./session-card-head";

type SessionCardProps = {
  session: SessionWithLabel;
  planId: string;
  startDate: string;
};

export const SessionCard: React.FC<SessionCardProps> = ({ session, planId, startDate }) => {
  const updateSession = useUpdateSession(planId, startDate);
  const deleteSession = useDeleteSession(planId, startDate);

  const isMutationPending = updateSession.isPending || deleteSession.isPending;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: session.id,
    disabled: isMutationPending,
  });

  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false);
  const kebabAnchorRef = useRef<HTMLButtonElement>(null);

  const toggleExpanded = () => setIsExpanded((previous) => !previous);
  const handleKebabOpen = () => setIsMenuOpen(true);
  const handleKebabClose = () => setIsMenuOpen(false);

  const handleLabelChange = (labelId: string | null) =>
    updateSession.mutate({ sessionId: session.id, data: { labelId } });

  const handleFreezeChange = (next: boolean) =>
    updateSession.mutate({ sessionId: session.id, data: { freezeLoadsAtCreation: next } });

  const handleNotesCommit = (next: string) =>
    updateSession.mutate({
      sessionId: session.id,
      data: { notes: next === "" ? null : next },
    });

  const handleDeleteOpen = () => {
    handleKebabClose();
    setIsDeleteOpen(true);
  };

  const handleDeleteClose = () => setIsDeleteOpen(false);

  const handleDeleteConfirm = () => {
    deleteSession.mutate({ sessionId: session.id }, { onSuccess: () => setIsDeleteOpen(false) });
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Stack
      ref={setNodeRef}
      style={style}
      direction="column"
      sx={(theme) => ({
        bgcolor: "background.paper",
        border: 1,
        borderColor: "divider",
        borderRadius: theme.spacing(0.5),
        overflow: "hidden",
      })}
    >
      <SessionCardHead
        session={session}
        isExpanded={isExpanded}
        onToggleExpanded={toggleExpanded}
        onLabelChange={handleLabelChange}
        onFreezeChange={handleFreezeChange}
        onNotesCommit={handleNotesCommit}
        onKebabOpen={handleKebabOpen}
        dragAttributes={attributes}
        dragListeners={listeners}
        kebabAnchorRef={kebabAnchorRef}
        isMutationPending={isMutationPending}
      />

      {isExpanded ? (
        <Stack direction="column" spacing={1.25} sx={{ p: 1.5 }}>
          <BlockList
            planId={planId}
            startDate={startDate}
            sessionId={session.id}
            blocks={session.blocks}
          />
        </Stack>
      ) : null}

      <Menu anchorEl={kebabAnchorRef.current} open={isMenuOpen} onClose={handleKebabClose}>
        <MenuItem onClick={handleDeleteOpen} sx={{ color: "error.main" }}>
          <ListItemIcon sx={{ color: "inherit" }}>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      <ConfirmationModal
        open={isDeleteOpen}
        onClose={handleDeleteClose}
        title="Delete session"
        type="danger"
        message="Delete this session?"
        details={session.label?.name ?? "Empty session"}
        onConfirm={handleDeleteConfirm}
        isConfirming={deleteSession.isPending}
      />
    </Stack>
  );
};
