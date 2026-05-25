"use client";

import { type RefObject } from "react";

import type { DraggableAttributes, DraggableSyntheticListeners } from "@dnd-kit/core";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ScheduleIcon from "@mui/icons-material/Schedule";
import { IconButton, Stack } from "@mui/material";

import type { SessionWithLabel } from "@repo/contracts/lms/day";
import { SESSION_CONSTANTS } from "@repo/contracts/lms/session";
import { InlineEditText, LabelPickerChip } from "@repo/ui";

import { useLabelOptions } from "@app/lib/hooks";

import { SessionCardCollapsedStats } from "./session-card-collapsed-stats";
import { SessionFreezeFlag } from "./session-freeze-flag";

type SessionCardHeadProps = {
  session: SessionWithLabel;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onLabelChange: (labelId: string | null) => void;
  onFreezeChange: (next: boolean) => void;
  onNotesCommit: (next: string) => void;
  onKebabOpen: () => void;
  dragAttributes: DraggableAttributes;
  dragListeners: DraggableSyntheticListeners;
  kebabAnchorRef: RefObject<HTMLButtonElement | null>;
  isMutationPending: boolean;
};

export const SessionCardHead: React.FC<SessionCardHeadProps> = ({
  session,
  isExpanded,
  onToggleExpanded,
  onLabelChange,
  onFreezeChange,
  onNotesCommit,
  onKebabOpen,
  dragAttributes,
  dragListeners,
  kebabAnchorRef,
  isMutationPending,
}) => {
  const sessionOptions = useLabelOptions("SESSION");
  const blockCount = session.blocks.length;
  const hasBlocks = blockCount > 0;

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1.25}
      sx={{
        px: 1.5,
        py: 1.25,
        minWidth: 0,
        ...(isExpanded && {
          borderBottom: 1,
          borderColor: "divider",
        }),
      }}
    >
      <IconButton
        {...dragAttributes}
        {...dragListeners}
        size="small"
        aria-label="Drag session"
        disabled={isMutationPending}
        sx={{ cursor: "grab", touchAction: "none" }}
      >
        <DragIndicatorIcon fontSize="small" />
      </IconButton>

      <IconButton
        size="small"
        onClick={onToggleExpanded}
        aria-label={isExpanded ? "Collapse session" : "Expand session"}
      >
        <ChevronRightIcon
          fontSize="small"
          sx={(theme) => ({
            transform: isExpanded ? "rotate(90deg)" : "none",
            transition: `transform ${theme.transitions.duration.shortest}ms ${theme.transitions.easing.easeInOut}`,
          })}
        />
      </IconButton>

      <ScheduleIcon
        sx={(theme) => ({
          width: theme.spacing(2.25),
          height: theme.spacing(2.25),
          color: "text.secondary",
        })}
      />

      <LabelPickerChip
        value={session.label}
        options={sessionOptions.options}
        level="SESSION"
        isLoading={sessionOptions.isLoading}
        onChange={onLabelChange}
        ariaLabel="Session label"
      />

      <SessionFreezeFlag
        value={session.freezeLoadsAtCreation}
        onChange={onFreezeChange}
        disabled={isMutationPending}
      />

      <InlineEditText
        value={session.notes ?? ""}
        onCommit={onNotesCommit}
        variant="body2"
        ariaLabel="Session notes"
        emptyIsValid
        placeholder="session note (~ duration, focus)…"
        maxLength={SESSION_CONSTANTS.MAX_NOTES_LENGTH}
        sx={{ flex: 1, minWidth: 0 }}
      />

      {!isExpanded && hasBlocks ? <SessionCardCollapsedStats blockCount={blockCount} /> : null}

      <IconButton
        ref={kebabAnchorRef}
        onClick={onKebabOpen}
        aria-label="Session actions"
        size="small"
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>
    </Stack>
  );
};
