"use client";

import type { DraggableAttributes, DraggableSyntheticListeners } from "@dnd-kit/core";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import DeleteIcon from "@mui/icons-material/Delete";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import ScheduleIcon from "@mui/icons-material/Schedule";
import { Box, IconButton, Stack, Tooltip } from "@mui/material";

import type { SessionWithLabel } from "@repo/contracts/lms/day";
import { SESSION_CONSTANTS } from "@repo/contracts/lms/session";
import { LabelPickerChip } from "@repo/ui";

import { useLabelOptions } from "@app/lib/hooks";

import { NotesListField } from "./notes-list-field";
import { SessionCardCollapsedStats } from "./session-card-collapsed-stats";

const DRAG_ARIA = "Drag session";
const DELETE_ARIA = "Delete session";
const DELETE_TOOLTIP = "Delete session";

const tooltipChildSx = { display: "inline-flex" };

type SessionCardHeadProps = {
  session: SessionWithLabel;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onLabelChange: (labelId: string | null) => void;
  onNotesCommit: (next: string[] | null) => void;
  onDeleteOpen: () => void;
  dragAttributes: DraggableAttributes;
  dragListeners: DraggableSyntheticListeners;
  isMutationPending: boolean;
};

export const SessionCardHead: React.FC<SessionCardHeadProps> = ({
  session,
  isExpanded,
  onToggleExpanded,
  onLabelChange,
  onNotesCommit,
  onDeleteOpen,
  dragAttributes,
  dragListeners,
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
        aria-label={DRAG_ARIA}
        disabled={isMutationPending}
        sx={{
          cursor: "grab",
          touchAction: "none",
          "&.Mui-focusVisible": {
            outline: "2px solid",
            outlineColor: "primary.main",
            outlineOffset: 2,
          },
        }}
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

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <NotesListField
          value={session.notes}
          onCommit={onNotesCommit}
          ariaLabel="Session notes"
          placeholder="session note (~ duration, focus)…"
          maxLength={SESSION_CONSTANTS.MAX_NOTES_LENGTH}
        />
      </Box>

      {!isExpanded && hasBlocks ? <SessionCardCollapsedStats blockCount={blockCount} /> : null}

      <Tooltip title={DELETE_TOOLTIP}>
        <span style={tooltipChildSx}>
          <IconButton
            size="small"
            onClick={onDeleteOpen}
            disabled={isMutationPending}
            aria-label={DELETE_ARIA}
            sx={{ color: "error.main" }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
    </Stack>
  );
};
