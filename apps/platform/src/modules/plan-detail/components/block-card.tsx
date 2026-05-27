"use client";

import { useMemo, useState } from "react";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Stack } from "@mui/material";

import type { Block } from "@repo/contracts/lms/block";
import type { Exercise } from "@repo/contracts/lms/exercise";
import { ConfirmationModal } from "@repo/ui";

import { useExercises, useLabelOptions } from "@app/lib/hooks";
import { useAssignBlockLabels, useDeleteBlock, useUpdateBlock } from "@app/lib/hooks";

import { BlockCardBody } from "./block-card-body";
import { BlockCardHead } from "./block-card-head";
import { BlockCardMeta } from "./block-card-meta";
import { BlockCardNote } from "./block-card-note";
import { BlockEditorModal } from "./block-editor-modal";

const DELETE_TITLE = "Delete block";
const DELETE_MESSAGE = "Delete this block?";
const DELETE_TYPE = "danger" as const;
const EMPTY_BLOCK_LABEL = "Empty block";
const LABEL_NAME_SEPARATOR = ", ";
const DRAG_OPACITY_DRAGGING = 0.5;
const DRAG_OPACITY_DEFAULT = 1;

type BlockCardProps = {
  block: Block;
  planId: string;
  startDate: string;
};

export const BlockCard: React.FC<BlockCardProps> = ({ block, planId, startDate }) => {
  const updateBlock = useUpdateBlock(planId, startDate);
  const deleteBlock = useDeleteBlock(planId, startDate);
  const assignLabels = useAssignBlockLabels(planId, startDate);
  const blockLabelOptions = useLabelOptions("BLOCK");
  const exercises = useExercises();

  const exerciseById = useMemo<ReadonlyMap<string, Exercise>>(
    () => new Map((exercises.data ?? []).map((e) => [e.id, e])),
    [exercises.data],
  );

  const isMutationPending =
    updateBlock.isPending || deleteBlock.isPending || assignLabels.isPending;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
    disabled: isMutationPending,
  });

  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false);

  const handleLabelsChange = (labelIds: string[]) =>
    assignLabels.mutate({ blockId: block.id, data: { labelIds } });

  const handleNotesCommit = (next: string) =>
    updateBlock.mutate({
      blockId: block.id,
      data: { notes: next === "" ? null : next },
    });

  const handleEditOpen = () => setIsEditOpen(true);
  const handleEditClose = () => setIsEditOpen(false);
  const handleDeleteOpen = () => setIsDeleteOpen(true);
  const handleDeleteClose = () => setIsDeleteOpen(false);

  const handleDeleteConfirm = () => {
    deleteBlock.mutate({ blockId: block.id }, { onSuccess: () => setIsDeleteOpen(false) });
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? DRAG_OPACITY_DRAGGING : DRAG_OPACITY_DEFAULT,
  };

  const deleteDetails =
    block.labels.length > 0
      ? block.labels.map((l) => l.name).join(LABEL_NAME_SEPARATOR)
      : EMPTY_BLOCK_LABEL;

  return (
    <Stack
      ref={setNodeRef}
      style={style}
      onDoubleClick={handleEditOpen}
      direction="column"
      sx={(theme) => ({
        bgcolor: "background.default",
        border: 1,
        borderColor: "divider",
        borderRadius: theme.spacing(0.5),
        overflow: "hidden",
      })}
    >
      <BlockCardHead
        block={block}
        labelOptions={blockLabelOptions.options}
        isLabelsLoading={blockLabelOptions.isLoading}
        isMutationPending={isMutationPending}
        dragAttributes={attributes}
        dragListeners={listeners}
        onLabelsChange={handleLabelsChange}
        onEditOpen={handleEditOpen}
        onDeleteOpen={handleDeleteOpen}
      />
      <BlockCardMeta intensity={block.intensity} timeCap={block.timeCap} />
      <BlockCardNote value={block.notes ?? ""} onCommit={handleNotesCommit} />
      <BlockCardBody
        block={block}
        planId={planId}
        startDate={startDate}
        exerciseById={exerciseById}
      />

      <BlockEditorModal
        open={isEditOpen}
        onClose={handleEditClose}
        block={block}
        planId={planId}
        startDate={startDate}
      />

      <ConfirmationModal
        open={isDeleteOpen}
        onClose={handleDeleteClose}
        title={DELETE_TITLE}
        type={DELETE_TYPE}
        message={DELETE_MESSAGE}
        details={deleteDetails}
        onConfirm={handleDeleteConfirm}
        isConfirming={deleteBlock.isPending}
      />
    </Stack>
  );
};
