"use client";

import { useState } from "react";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Stack } from "@mui/material";

import type { SessionWithLabel } from "@repo/contracts/lms/day";
import { ConfirmationModal } from "@repo/ui";

import {
  useCloneHighlight,
  useDeleteSession,
  useDuplicateSession,
  useUpdateSession,
} from "@app/lib/hooks";

import { cloneHighlightSx } from "../lib/clone-highlight-sx";

import { BlockList } from "./block-list";
import { SessionCardHead } from "./session-card-head";

const SESSION_DELETE_IDENTITY_SEPARATOR = " · ";
const SESSION_DELETE_EMPTY_LABEL = "Empty session";
const DRAG_OPACITY_DRAGGING = 0.5;
const DRAG_OPACITY_DEFAULT = 1;

type SessionCardProps = {
  session: SessionWithLabel;
  planId: string;
  startDate: string;
  isReorderPending?: boolean;
};

export const SessionCard: React.FC<SessionCardProps> = ({
  session,
  planId,
  startDate,
  isReorderPending = false,
}) => {
  const updateSession = useUpdateSession(planId, startDate);
  const deleteSession = useDeleteSession(planId, startDate);
  const duplicateSession = useDuplicateSession(planId, startDate);
  const { markCloned, isHighlighted, setNode } = useCloneHighlight(session.id);

  const isMutationPending =
    updateSession.isPending ||
    deleteSession.isPending ||
    duplicateSession.isPending ||
    isReorderPending;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: session.id,
    disabled: isMutationPending,
  });

  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false);

  const toggleExpanded = () => setIsExpanded((previous) => !previous);

  const handleLabelChange = (labelId: string | null) =>
    updateSession.mutate({ sessionId: session.id, data: { labelId } });

  const handleNotesCommit = (next: string[] | null) =>
    updateSession.mutate({
      sessionId: session.id,
      data: { notes: next },
    });

  const handleDeleteOpen = () => setIsDeleteOpen(true);

  const handleDeleteClose = () => setIsDeleteOpen(false);

  const handleDeleteConfirm = () => {
    deleteSession.mutate({ sessionId: session.id }, { onSuccess: () => setIsDeleteOpen(false) });
  };

  const handleDuplicate = () =>
    duplicateSession.mutate(
      { sessionId: session.id },
      { onSuccess: (created) => markCloned(created.id) },
    );

  const style = {
    transform: isDragging ? undefined : CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? DRAG_OPACITY_DRAGGING : DRAG_OPACITY_DEFAULT,
  };

  const deleteDetails = `${startDate}${SESSION_DELETE_IDENTITY_SEPARATOR}${session.label?.name ?? SESSION_DELETE_EMPTY_LABEL}`;

  return (
    <Stack
      ref={(node: HTMLDivElement | null) => {
        setNodeRef(node);
        setNode(node);
      }}
      style={style}
      direction="column"
      sx={[
        (theme) => ({
          bgcolor: "background.paper",
          border: 1,
          borderColor: "divider",
          borderRadius: theme.spacing(0.5),
          overflow: "hidden",
        }),
        cloneHighlightSx(isHighlighted),
      ]}
    >
      <SessionCardHead
        session={session}
        isExpanded={isExpanded}
        onToggleExpanded={toggleExpanded}
        onLabelChange={handleLabelChange}
        onNotesCommit={handleNotesCommit}
        onDeleteOpen={handleDeleteOpen}
        onDuplicate={handleDuplicate}
        dragAttributes={attributes}
        dragListeners={listeners}
        isMutationPending={isMutationPending}
      />

      {isExpanded ? (
        <Stack direction="column" spacing={1.25} sx={{ p: 1.5 }}>
          <BlockList
            planId={planId}
            startDate={startDate}
            sessionId={session.id}
            blocks={session.blocks}
            parentIsReorderPending={isMutationPending}
          />
        </Stack>
      ) : null}

      <ConfirmationModal
        open={isDeleteOpen}
        onClose={handleDeleteClose}
        title="Delete session"
        type="danger"
        message="Delete this session?"
        details={deleteDetails}
        onConfirm={handleDeleteConfirm}
        isConfirming={deleteSession.isPending}
      />
    </Stack>
  );
};
