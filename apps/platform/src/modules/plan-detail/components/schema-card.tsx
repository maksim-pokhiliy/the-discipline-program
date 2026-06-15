"use client";

import { type ReactElement, useState } from "react";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Stack } from "@mui/material";

import { type SchemaWithBody } from "@repo/contracts/lms/schema";
import { ConfirmationModal } from "@repo/ui";

import { useDeleteSchema, useUpdateSchema } from "@app/lib/hooks";

import { schemaSortableId } from "../lib/block-item-sortable-id";
import { formatSchemaHeader } from "../lib/format-schema-header";

import { AxisEditorModal } from "./axis-editor-modal";
import { SchemaCardHead } from "./schema-card-head";
import { SchemaRowList } from "./schema-row-list";

const DELETE_TITLE = "Delete schema";
const DELETE_MESSAGE = "Delete this schema?";
const DRAG_OPACITY_DRAGGING = 0.5;
const DRAG_OPACITY_DEFAULT = 1;
const OUTER_BORDER_RADIUS_FACTOR = 0.5;

type SchemaCardProps = {
  schema: SchemaWithBody;
  planId: string;
  startDate: string;
  parentIsReorderPending?: boolean;
  isBoxed?: boolean;
  isDraggable?: boolean;
  isSelectMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (schemaId: string) => void;
};

export const SchemaCard: React.FC<SchemaCardProps> = ({
  schema,
  planId,
  startDate,
  parentIsReorderPending = false,
  isBoxed = false,
  isDraggable = true,
  isSelectMode = false,
  isSelected = false,
  onToggleSelect,
}): ReactElement => {
  const updateSchema = useUpdateSchema(planId, startDate);
  const deleteSchema = useDeleteSchema(planId, startDate);

  const isMutationPending =
    updateSchema.isPending || deleteSchema.isPending || parentIsReorderPending;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: schemaSortableId(schema.schema.id),
    disabled: !isDraggable || isMutationPending,
  });

  const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false);
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const toggleExpanded = () => setIsExpanded((previous) => !previous);

  const handleDeleteOpen = () => setIsDeleteOpen(true);
  const handleEditOpen = () => setIsEditOpen(true);
  const handleEditClose = () => setIsEditOpen(false);

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
    transform: isDragging ? undefined : CSS.Transform.toString(transform),
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
        isMutationPending={isMutationPending}
        dragAttributes={attributes}
        dragListeners={listeners}
        onTitleCommit={handleTitleCommit}
        onDeleteOpen={handleDeleteOpen}
        onEditOpen={handleEditOpen}
        isExpanded={isExpanded}
        onToggleExpanded={toggleExpanded}
        isBoxed={isBoxed}
        isDraggable={isDraggable}
        isSelectMode={isSelectMode}
        isSelected={isSelected}
        onToggleSelect={onToggleSelect}
      />

      {isExpanded ? (
        <SchemaRowList
          rows={schema.rows}
          rowGroups={schema.rowGroups}
          schemaId={schema.schema.id}
          composition={schema.schema.composition}
          planId={planId}
          startDate={startDate}
          parentIsReorderPending={isMutationPending}
        />
      ) : null}

      <ConfirmationModal
        open={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title={DELETE_TITLE}
        type="danger"
        message={DELETE_MESSAGE}
        details={formatSchemaHeader(schema)}
        onConfirm={handleDeleteConfirm}
        isConfirming={deleteSchema.isPending}
      />

      {isEditOpen ? (
        <AxisEditorModal
          open={isEditOpen}
          onClose={handleEditClose}
          mode={{ kind: "edit", schema }}
          planId={planId}
          startDate={startDate}
        />
      ) : null}
    </Stack>
  );
};
