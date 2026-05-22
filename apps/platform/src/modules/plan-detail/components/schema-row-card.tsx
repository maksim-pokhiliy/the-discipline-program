"use client";

import { useMemo, useRef, useState } from "react";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import DeleteIcon from "@mui/icons-material/Delete";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import EditIcon from "@mui/icons-material/Edit";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import {
  Box,
  Chip,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
} from "@mui/material";

import type { SchemaRow } from "@repo/contracts/lms/schema-row";
import { ConfirmationModal } from "@repo/ui";

import { useDeleteSchemaRow, useUpdateSchemaRow } from "@app/lib/hooks";

import { formatRestRaw } from "./format-rest-raw";
import { LoadSummary } from "./load-summary";
import { RowEditorModal } from "./row-editor-modal";
import type { RowEditorMode } from "./row-editor-types";

const STEP_SEPARATOR = " → ";

type SchemaRowCardProps = {
  row: SchemaRow;
  planId: string;
  startDate: string;
};

export const SchemaRowCard: React.FC<SchemaRowCardProps> = ({ row, planId, startDate }) => {
  const updateSchemaRow = useUpdateSchemaRow(planId, startDate);
  const deleteSchemaRow = useDeleteSchemaRow(planId, startDate);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: row.id,
    disabled: updateSchemaRow.isPending || deleteSchemaRow.isPending,
  });

  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isEditOpen, setEditOpen] = useState(false);
  const [isDeleteOpen, setDeleteOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);

  const handleDeleteConfirm = () => {
    deleteSchemaRow.mutate({ schemaRowId: row.id }, { onSuccess: () => setDeleteOpen(false) });
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const editorMode = useMemo<RowEditorMode>(() => ({ kind: "edit", row }), [row]);

  const renderBody = (): React.ReactNode => {
    switch (row.rowPayload.rowKind) {
      case "STANDALONE_LOAD":
        return <LoadSummary load={row.rowPayload.load} />;
      case "REST":
        return <Chip size="small" label={formatRestRaw(row.rowPayload.parsed)} />;
      case "INNER_LADDER_MARKER":
        return <Chip size="small" label={row.rowPayload.steps.join(STEP_SEPARATOR)} />;
      case "STANDALONE_URL":
        return <Chip size="small" label={row.rowPayload.url} />;
      default:
        return <Chip size="small" variant="outlined" label={row.rowPayload.rowKind} />;
    }
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
          aria-label="Drag row"
          sx={{ cursor: "grab", touchAction: "none" }}
        >
          <DragIndicatorIcon fontSize="small" />
        </IconButton>

        <Box sx={{ flex: 1, minWidth: 0 }}>{renderBody()}</Box>

        <IconButton
          ref={anchorRef}
          onClick={() => setMenuOpen(true)}
          aria-label="Row actions"
          size="small"
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
      </Stack>

      <Menu anchorEl={anchorRef.current} open={isMenuOpen} onClose={() => setMenuOpen(false)}>
        <MenuItem
          onClick={() => {
            setMenuOpen(false);
            setEditOpen(true);
          }}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>

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

      <RowEditorModal
        open={isEditOpen}
        onClose={() => setEditOpen(false)}
        mode={editorMode}
        planId={planId}
        startDate={startDate}
      />

      <ConfirmationModal
        open={isDeleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete row"
        type="danger"
        message="Delete this row?"
        onConfirm={handleDeleteConfirm}
        isConfirming={deleteSchemaRow.isPending}
      />
    </Box>
  );
};
