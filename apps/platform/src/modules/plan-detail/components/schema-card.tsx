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
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";

import type { SchemaWithBody } from "@repo/contracts/lms/schema";
import { ConfirmationModal } from "@repo/ui";

import { useDeleteSchema, useUpdateSchema } from "@app/lib/hooks";

import { SchemaEditorModal } from "./schema-editor-modal";
import type { SchemaEditorMode } from "./schema-editor-types";
import { SchemaParamsSummary } from "./schema-params-summary";

type SchemaCardProps = {
  schema: SchemaWithBody;
  planId: string;
  startDate: string;
};

export const SchemaCard: React.FC<SchemaCardProps> = ({ schema, planId, startDate }) => {
  const updateSchema = useUpdateSchema(planId, startDate);
  const deleteSchema = useDeleteSchema(planId, startDate);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: schema.schema.id,
    disabled: updateSchema.isPending || deleteSchema.isPending,
  });

  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);

  const handleDeleteConfirm = () => {
    deleteSchema.mutate({ schemaId: schema.schema.id }, { onSuccess: () => setDeleteOpen(false) });
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const title = schema.schema.header ?? schema.schema.archetypeParams.archetype;

  const editorMode = useMemo<SchemaEditorMode>(() => ({ kind: "edit", schema }), [schema]);

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
          aria-label="Drag schema"
          sx={{ cursor: "grab", touchAction: "none" }}
        >
          <DragIndicatorIcon fontSize="small" />
        </IconButton>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" noWrap>
            {title}
          </Typography>

          <Box sx={{ pt: 0.5 }}>
            <SchemaParamsSummary archetypeParams={schema.schema.archetypeParams} />
          </Box>
        </Box>

        <IconButton
          ref={anchorRef}
          onClick={() => setMenuOpen(true)}
          aria-label="Schema actions"
          size="small"
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
      </Stack>

      <Menu anchorEl={anchorRef.current} open={menuOpen} onClose={() => setMenuOpen(false)}>
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

      <SchemaEditorModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        mode={editorMode}
        planId={planId}
        startDate={startDate}
      />

      <ConfirmationModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete schema"
        type="danger"
        message="Delete this schema?"
        details={title}
        onConfirm={handleDeleteConfirm}
        isConfirming={deleteSchema.isPending}
      />
    </Box>
  );
};
