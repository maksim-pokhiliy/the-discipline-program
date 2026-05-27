"use client";

import { useMemo, useState } from "react";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import DeleteIcon from "@mui/icons-material/Delete";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import TuneIcon from "@mui/icons-material/Tune";
import { Box, IconButton, Link, Tooltip, Typography, alpha, type Theme } from "@mui/material";

import type { Exercise } from "@repo/contracts/lms/exercise";
import type { RowKind, SchemaRow } from "@repo/contracts/lms/schema-row";
import { ConfirmationModal, RowKindBadge } from "@repo/ui";

import { useDeleteSchemaRow, useUpdateSchemaRow } from "@app/lib/hooks";

import { formatRow } from "../lib/format-row";

import { RowEditorModal } from "./row-editor-modal";
import { type RowEditorMode } from "./row-editor-types";
import { SchemaRowCardBody } from "./schema-row-card-body";

const GRID_TEMPLATE_COLUMNS = "24px 24px 32px 1fr auto auto auto";
const GRID_GAP_FACTOR = 1.25;
const PADDING_X_FACTOR = 1.5;
const PADDING_Y_FACTOR = 1;
const DEMO_GAP_FACTOR = 0.5;
const DEMO_PX_FACTOR = 0.75;
const DEMO_PY_FACTOR = 0.5;
const DEMO_BORDER_RADIUS_FACTOR = 0.5;
const TINT_ALPHA = 0.04;
const TINT_HOVER_ALPHA = 0.07;
const LADDER_TINT_ALPHA = 0.02;
const DRAG_OPACITY_DRAGGING = 0.5;
const DRAG_OPACITY_DEFAULT = 1;
const TRANSITION_BG = "background-color 150ms";
const DELETE_TITLE = "Delete row";
const DELETE_MESSAGE = "Delete this row?";
const DRAG_ARIA = "Drag row";
const EDIT_ARIA = "Edit row";
const EDIT_TOOLTIP = "Edit row";
const DELETE_ARIA = "Delete row";
const DELETE_TOOLTIP = "Delete row";

const tooltipChildSx = { display: "inline-flex" };

type SchemaRowCardProps = {
  row: SchemaRow;
  planId: string;
  startDate: string;
  exerciseById: ReadonlyMap<string, Exercise>;
  index: number;
  isReorderPending: boolean;
};

type RowTintSx = {
  bgcolor?: string;
  "&:hover"?: { bgcolor: string };
};

const getRowTintSx = (rowKind: RowKind, theme: Theme): RowTintSx => {
  switch (rowKind) {
    case "STANDALONE_LOAD":
    case "STANDALONE_URL":
      return {
        bgcolor: alpha(theme.palette.kind.load, TINT_ALPHA),
        "&:hover": { bgcolor: alpha(theme.palette.kind.load, TINT_HOVER_ALPHA) },
      };
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

export const SchemaRowCard: React.FC<SchemaRowCardProps> = ({
  row,
  planId,
  startDate,
  exerciseById,
  index,
  isReorderPending,
}) => {
  const updateSchemaRow = useUpdateSchemaRow(planId, startDate);
  const deleteSchemaRow = useDeleteSchemaRow(planId, startDate);

  const isMutationPending =
    updateSchemaRow.isPending || deleteSchemaRow.isPending || isReorderPending;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: row.id,
    disabled: isMutationPending,
  });

  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false);

  const fmt = useMemo(() => formatRow(row, exerciseById, index), [row, exerciseById, index]);

  const editorMode = useMemo<RowEditorMode>(() => ({ kind: "edit", row }), [row]);

  const rowKind = row.rowPayload.rowKind;
  const isFootnote = rowKind === "FOOTNOTE";

  const handleEditOpen = () => setIsEditOpen(true);

  const handleEditClose = () => setIsEditOpen(false);

  const handleDeleteOpen = () => setIsDeleteOpen(true);

  const handleDeleteClose = () => setIsDeleteOpen(false);

  const handleDeleteConfirm = () =>
    deleteSchemaRow.mutate({ schemaRowId: row.id }, { onSuccess: handleDeleteClose });

  const handleDoubleClick = (event: React.MouseEvent) => {
    if (event.target instanceof HTMLElement && event.target.closest("button") !== null) {
      return;
    }

    event.stopPropagation();

    if (isMutationPending) {
      return;
    }

    handleEditOpen();
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? DRAG_OPACITY_DRAGGING : DRAG_OPACITY_DEFAULT,
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      onDoubleClick={handleDoubleClick}
      sx={(theme) => ({
        display: "grid",
        gridTemplateColumns: GRID_TEMPLATE_COLUMNS,
        gap: theme.spacing(GRID_GAP_FACTOR),
        alignItems: "center",
        px: theme.spacing(PADDING_X_FACTOR),
        py: theme.spacing(PADDING_Y_FACTOR),
        borderBottom: 1,
        borderColor: "divider",
        transition: TRANSITION_BG,
        "&:hover": { bgcolor: "action.hover" },
        ...getRowTintSx(rowKind, theme),
        fontStyle: isFootnote ? "italic" : "inherit",
        "&:last-of-type": { borderBottom: 0 },
      })}
    >
      <IconButton
        {...attributes}
        {...listeners}
        size="small"
        aria-label={DRAG_ARIA}
        disabled={isMutationPending}
        sx={{ cursor: "grab", touchAction: "none" }}
      >
        <DragIndicatorIcon fontSize="small" />
      </IconButton>

      <Typography
        variant="caption"
        color="text.subtle"
        sx={{ fontVariantNumeric: "tabular-nums", textAlign: "center" }}
      >
        {fmt.ord}
      </Typography>

      <RowKindBadge kind={fmt.kindCls} label={fmt.kindBadge} dashed={fmt.dashed} />

      <SchemaRowCardBody
        mainText={fmt.mainText}
        formPillText={fmt.formPillText}
        subParts={fmt.subParts}
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
        <span />
      )}

      <Tooltip title={EDIT_TOOLTIP}>
        <span style={tooltipChildSx}>
          <IconButton
            size="small"
            onClick={handleEditOpen}
            disabled={isMutationPending}
            aria-label={EDIT_ARIA}
          >
            <TuneIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>

      <Tooltip title={DELETE_TOOLTIP}>
        <span style={tooltipChildSx}>
          <IconButton
            size="small"
            onClick={handleDeleteOpen}
            disabled={isMutationPending}
            aria-label={DELETE_ARIA}
            sx={{ color: "error.main" }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>

      <RowEditorModal
        open={isEditOpen}
        onClose={handleEditClose}
        mode={editorMode}
        planId={planId}
        startDate={startDate}
      />

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
    </Box>
  );
};
