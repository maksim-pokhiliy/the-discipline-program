"use client";

import { useMemo, useState } from "react";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import TuneIcon from "@mui/icons-material/Tune";
import { Box, Checkbox, IconButton, Link, Tooltip, Typography } from "@mui/material";

import type { SchemaRow } from "@repo/contracts/lms/schema-row";
import { ConfirmationModal } from "@repo/ui";

import { useCatalog, useDeleteSchemaRow, useDuplicateSchemaRow } from "@app/lib/hooks";

import { formatRow } from "../lib/format-row";
import { rowSortableId } from "../lib/row-item-sortable-id";

import { RowEditorModal } from "./row-editor-modal";
import { RowTimelineMarker } from "./row-timeline-marker";
import { SchemaRowCardBody } from "./schema-row-card-body";

const COL_ORD = "24px";
const COL_BODY = "1fr";
const COL_ACTIONS = "auto auto auto auto";

const gridTemplateFor = (isSelectMode: boolean, isDraggable: boolean): string => {
  const lead = isSelectMode ? "auto" : isDraggable ? "24px" : null;

  return [lead, COL_ORD, COL_BODY, COL_ACTIONS].filter(Boolean).join(" ");
};
const GRID_GAP_FACTOR = 1.25;
const PADDING_X_FACTOR = 1.5;
const DEMO_GAP_FACTOR = 0.5;
const DEMO_PX_FACTOR = 0.75;
const DEMO_PY_FACTOR = 0.5;
const DEMO_BORDER_RADIUS_FACTOR = 0.5;
const DRAG_OPACITY_DRAGGING = 0.5;
const DRAG_OPACITY_DEFAULT = 1;
const TRANSITION_BG = "background-color 150ms";
const DELETE_TITLE = "Delete row";
const DELETE_MESSAGE = "Delete this row?";
const DRAG_ARIA = "Drag row";
const EDIT_ARIA = "Edit row";
const EDIT_TOOLTIP = "Edit row";
const DUPLICATE_ARIA = "Duplicate row";
const DUPLICATE_TOOLTIP = "Duplicate row";
const DELETE_ARIA = "Delete row";
const DELETE_TOOLTIP = "Delete row";
const SELECT_ARIA = "Select row";

const tooltipChildSx = { display: "inline-flex" };

type SchemaRowCardProps = {
  row: SchemaRow;
  planId: string;
  startDate: string;
  index: number;
  minuteLabel?: string | null;
  isReorderPending: boolean;
  isDraggable?: boolean;
  timeline?: { ord: number; isFirst: boolean; isLast: boolean };
  isSelectMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (rowId: string) => void;
};

export const SchemaRowCard: React.FC<SchemaRowCardProps> = ({
  row,
  planId,
  startDate,
  index,
  minuteLabel = null,
  isReorderPending,
  isDraggable = true,
  timeline,
  isSelectMode = false,
  isSelected = false,
  onToggleSelect,
}) => {
  const deleteSchemaRow = useDeleteSchemaRow(planId, startDate);
  const duplicateSchemaRow = useDuplicateSchemaRow(planId, startDate);
  const { exerciseById } = useCatalog();

  const isMutationPending =
    deleteSchemaRow.isPending || duplicateSchemaRow.isPending || isReorderPending;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: rowSortableId(row.id),
    disabled: !isDraggable || isMutationPending,
  });

  const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false);
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);

  const fmt = useMemo(() => formatRow(row, exerciseById, index), [row, exerciseById, index]);

  const handleDeleteOpen = () => setIsDeleteOpen(true);

  const handleDeleteClose = () => setIsDeleteOpen(false);

  const handleDeleteConfirm = () =>
    deleteSchemaRow.mutate({ schemaRowId: row.id }, { onSuccess: handleDeleteClose });

  const style = {
    transform: isDragging ? undefined : CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? DRAG_OPACITY_DRAGGING : DRAG_OPACITY_DEFAULT,
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      sx={(theme) => ({
        display: "grid",
        gridTemplateColumns: gridTemplateFor(isSelectMode, isDraggable),
        gap: theme.spacing(GRID_GAP_FACTOR),
        alignItems: "center",
        px: theme.spacing(PADDING_X_FACTOR),
        borderBottom: 1,
        borderColor: "divider",
        transition: TRANSITION_BG,
        "&:hover": { bgcolor: "action.hover" },
        "&:last-of-type": { borderBottom: 0 },
      })}
    >
      {isSelectMode ? (
        <Checkbox
          size="small"
          checked={isSelected}
          onChange={() => onToggleSelect?.(row.id)}
          inputProps={{ "aria-label": SELECT_ARIA }}
        />
      ) : isDraggable ? (
        <IconButton
          {...attributes}
          {...listeners}
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
      ) : null}

      {timeline ? (
        <RowTimelineMarker ord={timeline.ord} isFirst={timeline.isFirst} isLast={timeline.isLast} />
      ) : (
        <Typography
          variant="caption"
          color="text.subtle"
          sx={{ fontVariantNumeric: "tabular-nums", textAlign: "center" }}
        >
          {fmt.ord}
        </Typography>
      )}

      <SchemaRowCardBody
        mainText={fmt.mainText}
        formPillText={fmt.formPillText}
        summary={fmt.summary}
        minuteLabel={minuteLabel}
      />

      {fmt.demoUrl !== null ? (
        <Link
          href={fmt.demoUrl}
          target="_blank"
          rel="noopener noreferrer"
          underline="none"
          sx={(theme) => ({
            display: "inline-flex",
            alignItems: "center",
            gap: DEMO_GAP_FACTOR,
            color: "text.subtle",
            px: DEMO_PX_FACTOR,
            py: DEMO_PY_FACTOR,
            borderRadius: DEMO_BORDER_RADIUS_FACTOR,
            "&:hover": {
              bgcolor: "action.hover",
              color: theme.palette.kind.load,
            },
          })}
        >
          <PlayCircleOutlineIcon fontSize="small" />
          <Typography variant="caption" color="inherit">
            demo
          </Typography>
        </Link>
      ) : (
        <Box component="span" />
      )}

      <Tooltip title={EDIT_TOOLTIP}>
        <Box component="span" style={tooltipChildSx}>
          <IconButton
            size="small"
            onClick={() => setIsEditOpen(true)}
            disabled={isMutationPending}
            aria-label={EDIT_ARIA}
          >
            <TuneIcon fontSize="small" />
          </IconButton>
        </Box>
      </Tooltip>

      <Tooltip title={DUPLICATE_TOOLTIP}>
        <Box component="span" style={tooltipChildSx}>
          <IconButton
            size="small"
            onClick={() => duplicateSchemaRow.mutate({ schemaRowId: row.id })}
            disabled={isMutationPending}
            aria-busy={isMutationPending}
            aria-label={DUPLICATE_ARIA}
          >
            <ContentCopyIcon fontSize="small" />
          </IconButton>
        </Box>
      </Tooltip>

      <Tooltip title={DELETE_TOOLTIP}>
        <Box component="span" style={tooltipChildSx}>
          <IconButton
            size="small"
            onClick={handleDeleteOpen}
            disabled={isMutationPending}
            aria-label={DELETE_ARIA}
            sx={{ color: "error.main" }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      </Tooltip>

      <ConfirmationModal
        open={isDeleteOpen}
        onClose={handleDeleteClose}
        title={DELETE_TITLE}
        type="danger"
        message={DELETE_MESSAGE}
        details={fmt.mainText}
        onConfirm={handleDeleteConfirm}
        isConfirming={deleteSchemaRow.isPending}
      />

      {isEditOpen ? (
        <RowEditorModal
          open={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          planId={planId}
          startDate={startDate}
          mode={{ kind: "edit", row }}
        />
      ) : null}
    </Box>
  );
};
