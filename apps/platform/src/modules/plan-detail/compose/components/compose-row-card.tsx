"use client";

import { useMemo } from "react";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import { alpha, Box, IconButton, Stack, type Theme, Typography } from "@mui/material";

import type { Exercise } from "@repo/contracts/lms/exercise";
import type { RowKind } from "@repo/contracts/lms/schema-row";
import { RowKindBadge } from "@repo/ui";

import { MinutePill } from "../../components/minute-pill";
import type { ComposeRow, NodeId } from "../compose-tree.types";
import { buildRowSummary } from "../lib/row-summary";

import { ComposeNodeActions } from "./compose-node-actions";

const GRID_TEMPLATE_COLUMNS = "24px 36px 1fr auto";
const GRID_GAP_FACTOR = 1.25;
const CONTENT_GAP_FACTOR = 0.75;
const PADDING_X_FACTOR = 1.5;
const PADDING_Y_FACTOR = 0.75;
const BORDER_RADIUS_FACTOR = 0.5;
const TINT_ALPHA = 0.04;
const LADDER_TINT_ALPHA = 0.02;
const SELECTED_BORDER_ALPHA = 0.6;
const DRAG_OPACITY_DRAGGING = 0.5;
const DRAG_OPACITY_DEFAULT = 1;
const DRAG_ARIA = "Drag row";

type RowTintSx = { bgcolor?: string };

const getRowTintSx = (rowKind: RowKind, theme: Theme): RowTintSx => {
  switch (rowKind) {
    case "STANDALONE_LOAD":
    case "STANDALONE_URL":
      return { bgcolor: alpha(theme.palette.kind.load, TINT_ALPHA) };
    case "REST":
    case "REST_SLOT":
      return { bgcolor: alpha(theme.palette.kind.rest, TINT_ALPHA) };
    case "FOOTNOTE":
      return { bgcolor: alpha(theme.palette.kind.foot, TINT_ALPHA) };
    case "INNER_LADDER_MARKER":
      return { bgcolor: alpha(theme.palette.text.primary, LADDER_TINT_ALPHA) };
    case "EXERCISE":
    case "PLACEHOLDER":
    case "REP_DEFINITION":
      return {};
    default:
      rowKind satisfies never;

      return {};
  }
};

type ComposeRowCardProps = {
  row: ComposeRow;
  exerciseById: Map<string, Exercise>;
  isSelected: boolean;
  isStructuralEditingAllowed: boolean;
  onSelect: (id: NodeId) => void;
  onDuplicate: (id: NodeId) => void;
  onDelete: (id: NodeId) => void;
  minuteLabel?: string | null;
};

export const ComposeRowCard: React.FC<ComposeRowCardProps> = ({
  row,
  exerciseById,
  isSelected,
  isStructuralEditingAllowed,
  onSelect,
  onDuplicate,
  onDelete,
  minuteLabel = null,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: row.id,
  });

  const summary = useMemo(() => buildRowSummary(row, exerciseById), [row, exerciseById]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? DRAG_OPACITY_DRAGGING : DRAG_OPACITY_DEFAULT,
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      onClick={() => onSelect(row.id)}
      sx={(theme) => ({
        display: "grid",
        gridTemplateColumns: GRID_TEMPLATE_COLUMNS,
        gap: theme.spacing(GRID_GAP_FACTOR),
        alignItems: "center",
        px: theme.spacing(PADDING_X_FACTOR),
        py: theme.spacing(PADDING_Y_FACTOR),
        border: 1,
        borderRadius: theme.spacing(BORDER_RADIUS_FACTOR),
        borderColor: isSelected
          ? alpha(theme.palette.primary.main, SELECTED_BORDER_ALPHA)
          : "divider",
        cursor: "pointer",
        "&:hover": { bgcolor: "action.hover" },
        ...getRowTintSx(row.rowKind, theme),
      })}
    >
      {isStructuralEditingAllowed ? (
        <IconButton
          {...attributes}
          {...listeners}
          size="small"
          aria-label={DRAG_ARIA}
          onClick={(event) => event.stopPropagation()}
          sx={{ cursor: "grab", touchAction: "none" }}
        >
          <DragIndicatorIcon fontSize="small" />
        </IconButton>
      ) : (
        <Box />
      )}

      <RowKindBadge
        kind={summary.badge.kind}
        label={summary.badge.label}
        dashed={summary.badge.dashed}
      />

      <Stack direction="row" alignItems="center" spacing={CONTENT_GAP_FACTOR} sx={{ minWidth: 0 }}>
        {minuteLabel !== null ? <MinutePill label={minuteLabel} /> : null}

        <Typography
          variant="body2"
          sx={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}
        >
          {summary.label}
        </Typography>
      </Stack>

      <Box onClick={(event) => event.stopPropagation()}>
        <ComposeNodeActions
          nodeId={row.id}
          isStructuralEditingAllowed={isStructuralEditingAllowed}
          onInspect={onSelect}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
        />
      </Box>
    </Box>
  );
};
