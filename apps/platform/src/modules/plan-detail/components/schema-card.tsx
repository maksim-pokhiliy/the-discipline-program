"use client";

import { type ReactElement, useState } from "react";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Stack } from "@mui/material";

import { isStructurallyParallel } from "@repo/contracts/lms/composition";
import { type SchemaWithBody, SCHEMA_CONSTANTS } from "@repo/contracts/lms/schema";
import { ConfirmationModal, InlineEditText } from "@repo/ui";

import { useDeleteSchema, useUpdateSchema } from "@app/lib/hooks";

import { type BlockCtx } from "../lib/build-cascade-chips";
import { formatSchemaHeader } from "../lib/format-schema-header";

import { AddSubSchemaButton } from "./add-sub-schema-button";
import { AxisEditorModal } from "./axis-editor-modal";
import { SchemaCardHead } from "./schema-card-head";
import { SchemaGroupBox } from "./schema-group-box";
import { SchemaList } from "./schema-list";
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
const BOX_LABEL_ARIA = "Group label";
const BOX_LABEL_PLACEHOLDER = "group…";

type SchemaCardProps = {
  schema: SchemaWithBody;
  planId: string;
  startDate: string;
  blockCtx: BlockCtx;
  parentIsReorderPending?: boolean;
};

export const SchemaCard: React.FC<SchemaCardProps> = ({
  schema,
  planId,
  startDate,
  blockCtx,
  parentIsReorderPending = false,
}): ReactElement => {
  const updateSchema = useUpdateSchema(planId, startDate);
  const deleteSchema = useDeleteSchema(planId, startDate);

  const isMutationPending =
    updateSchema.isPending || deleteSchema.isPending || parentIsReorderPending;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: schema.schema.id,
    disabled: isMutationPending,
  });

  const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false);
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);

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

  const isBox =
    schema.schema.composition !== null &&
    isStructurallyParallel(schema.schema.composition, {
      containerChildCount: schema.subSchemas.length,
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? DRAG_OPACITY_DRAGGING : DRAG_OPACITY_DEFAULT,
  };

  const renderMembers = (
    <>
      {schema.subSchemas.length > 0 ? (
        <SchemaList
          planId={planId}
          startDate={startDate}
          parentSchemaId={schema.schema.id}
          schemas={schema.subSchemas}
          parentIsReorderPending={isMutationPending}
          renderItem={(sub, pending) => (
            <SchemaCard
              key={sub.schema.id}
              schema={sub}
              planId={planId}
              startDate={startDate}
              blockCtx={blockCtx}
              parentIsReorderPending={pending}
            />
          )}
        />
      ) : null}

      <AddSubSchemaButton
        planId={planId}
        startDate={startDate}
        blockId={schema.schema.blockId}
        parentSchemaId={schema.schema.id}
      />
    </>
  );

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
        isMutationPending={isMutationPending}
        dragAttributes={attributes}
        dragListeners={listeners}
        onTitleCommit={handleTitleCommit}
        onDeleteOpen={handleDeleteOpen}
        onEditOpen={handleEditOpen}
        isBoxed={isBox}
      />

      {isBox ? (
        <SchemaGroupBox
          label={
            <InlineEditText
              value={schema.schema.header ?? ""}
              onCommit={handleTitleCommit}
              variant="h4"
              ariaLabel={BOX_LABEL_ARIA}
              emptyIsValid
              maxLength={SCHEMA_CONSTANTS.MAX_HEADER_LENGTH}
              placeholder={BOX_LABEL_PLACEHOLDER}
            />
          }
        >
          {renderMembers}
        </SchemaGroupBox>
      ) : (
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
          {renderMembers}
        </Stack>
      )}

      <SchemaRowList
        rows={schema.rows}
        schemaId={schema.schema.id}
        composition={schema.schema.composition}
        planId={planId}
        startDate={startDate}
        parentIsReorderPending={isMutationPending}
      />

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
