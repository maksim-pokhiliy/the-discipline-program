"use client";

import { type ReactElement, useMemo, useRef, useState } from "react";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { ListItemIcon, ListItemText, Menu, MenuItem, Stack } from "@mui/material";

import { type SchemaWithBody } from "@repo/contracts/lms/schema";
import { ConfirmationModal } from "@repo/ui";

import { useArchetypes, useDeleteSchema, useUpdateSchema } from "@app/lib/hooks";

import { type BlockCtx } from "../lib/build-cascade-chips";
import { formatSchemaHeader } from "../lib/format-schema-header";

import { SchemaCardHead } from "./schema-card-head";
import { SchemaEditorModal } from "./schema-editor-modal";
import { type SchemaEditorMode } from "./schema-editor-types";
import { SchemaRowList } from "./schema-row-list";

const DELETE_TITLE = "Delete schema";
const DELETE_MESSAGE = "Delete this schema?";
const DRAG_OPACITY_DRAGGING = 0.5;
const DRAG_OPACITY_DEFAULT = 1;
const SUB_SCHEMAS_PL_FACTOR = 3.75;
const SUB_SCHEMAS_SPACING = 0.75;
const PADDING_X_FACTOR = 1.5;
const PADDING_B_FACTOR = 1.25;
const PADDING_T_FACTOR = 0.5;
const OUTER_BORDER_RADIUS_FACTOR = 0.5;

type SchemaCardProps = {
  schema: SchemaWithBody;
  planId: string;
  startDate: string;
  blockCtx: BlockCtx;
  isSubSchema?: boolean;
};

export const SchemaCard: React.FC<SchemaCardProps> = ({
  schema,
  planId,
  startDate,
  blockCtx,
  isSubSchema = false,
}): ReactElement => {
  const updateSchema = useUpdateSchema(planId, startDate);
  const deleteSchema = useDeleteSchema(planId, startDate);
  const archetypes = useArchetypes();

  const isMutationPending = updateSchema.isPending || deleteSchema.isPending;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: schema.schema.id,
    disabled: isSubSchema || isMutationPending,
  });

  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false);
  const kebabAnchorRef = useRef<HTMLButtonElement>(null);

  const archetypeById = useMemo(
    () => new Map((archetypes.data ?? []).map((a) => [a.id, a])),
    [archetypes.data],
  );

  const archetypeLabel = archetypeById.get(schema.schema.archetypeId)?.label ?? null;

  const editorMode = useMemo<SchemaEditorMode>(() => ({ kind: "edit", schema }), [schema]);

  const handleKebabClose = () => setIsMenuOpen(false);

  const handleEditOpen = () => {
    setIsMenuOpen(false);
    setIsEditOpen(true);
  };

  const handleDeleteOpen = () => {
    setIsMenuOpen(false);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = () =>
    deleteSchema.mutate(
      { schemaId: schema.schema.id },
      { onSuccess: () => setIsDeleteOpen(false) },
    );

  const handleTitleCommit = (next: string) => {
    const trimmed = next.trim();
    const currentTrimmed = (schema.schema.header ?? "").trim();

    if (trimmed === currentTrimmed) {
      return;
    }

    const nextHeader = trimmed === "" ? null : trimmed;

    updateSchema.mutate({ schemaId: schema.schema.id, data: { header: nextHeader } });
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? DRAG_OPACITY_DRAGGING : DRAG_OPACITY_DEFAULT,
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
        borderRadius: theme.spacing(OUTER_BORDER_RADIUS_FACTOR),
        overflow: "hidden",
      })}
    >
      <SchemaCardHead
        schema={schema}
        blockCtx={blockCtx}
        archetypeLabel={archetypeLabel}
        isMutationPending={isMutationPending}
        isSubSchema={isSubSchema}
        dragAttributes={attributes}
        dragListeners={listeners}
        kebabAnchorRef={kebabAnchorRef}
        onTitleCommit={handleTitleCommit}
        onKebabOpen={() => setIsMenuOpen(true)}
      />

      {schema.subSchemas.length > 0 ? (
        <Stack
          direction="column"
          spacing={SUB_SCHEMAS_SPACING}
          sx={(theme) => ({
            pl: theme.spacing(SUB_SCHEMAS_PL_FACTOR),
            pr: theme.spacing(PADDING_X_FACTOR),
            pb: theme.spacing(PADDING_B_FACTOR),
            pt: theme.spacing(PADDING_T_FACTOR),
          })}
        >
          {schema.subSchemas.map((sub) => (
            <SchemaCard
              key={sub.schema.id}
              schema={sub}
              planId={planId}
              startDate={startDate}
              blockCtx={blockCtx}
              isSubSchema
            />
          ))}
        </Stack>
      ) : null}

      <Stack
        sx={(theme) => ({
          px: theme.spacing(PADDING_X_FACTOR),
          pb: theme.spacing(PADDING_B_FACTOR),
        })}
      >
        <SchemaRowList
          rows={schema.rows}
          schemaId={schema.schema.id}
          planId={planId}
          startDate={startDate}
        />
      </Stack>

      {!isSubSchema ? (
        <>
          <Menu anchorEl={kebabAnchorRef.current} open={isMenuOpen} onClose={handleKebabClose}>
            <MenuItem onClick={handleEditOpen}>
              <ListItemIcon>
                <EditIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Edit</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleDeleteOpen} sx={{ color: "error.main" }}>
              <ListItemIcon sx={{ color: "inherit" }}>
                <DeleteIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Delete</ListItemText>
            </MenuItem>
          </Menu>

          <SchemaEditorModal
            open={isEditOpen}
            onClose={() => setIsEditOpen(false)}
            mode={editorMode}
            planId={planId}
            startDate={startDate}
          />

          <ConfirmationModal
            open={isDeleteOpen}
            onClose={() => setIsDeleteOpen(false)}
            title={DELETE_TITLE}
            type="danger"
            message={DELETE_MESSAGE}
            details={formatSchemaHeader(schema, archetypeLabel)}
            onConfirm={handleDeleteConfirm}
            isConfirming={deleteSchema.isPending}
          />
        </>
      ) : null}
    </Stack>
  );
};
