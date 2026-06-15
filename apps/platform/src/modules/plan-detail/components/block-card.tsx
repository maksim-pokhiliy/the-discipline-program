"use client";

import { useState } from "react";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Stack } from "@mui/material";

import type { Block } from "@repo/contracts/lms/block";
import { ConfirmationModal } from "@repo/ui";

import { useLabelOptions } from "@app/lib/hooks";
import {
  useAssignBlockLabels,
  useCloneHighlight,
  useDeleteBlock,
  useDuplicateBlock,
  useUpdateBlock,
} from "@app/lib/hooks";

import { cloneHighlightSx } from "../lib/clone-highlight-sx";

import { BlockCardBody } from "./block-card-body";
import { BlockCardHead } from "./block-card-head";
import { BlockCardNote } from "./block-card-note";

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
  isReorderPending?: boolean;
};

export const BlockCard: React.FC<BlockCardProps> = ({
  block,
  planId,
  startDate,
  isReorderPending = false,
}) => {
  const updateBlock = useUpdateBlock(planId, startDate);
  const deleteBlock = useDeleteBlock(planId, startDate);
  const duplicateBlock = useDuplicateBlock(planId, startDate);
  const assignLabels = useAssignBlockLabels(planId, startDate);
  const blockLabelOptions = useLabelOptions("BLOCK");
  const { markCloned, isHighlighted, setNode } = useCloneHighlight(block.id);

  const isMutationPending =
    updateBlock.isPending ||
    deleteBlock.isPending ||
    duplicateBlock.isPending ||
    assignLabels.isPending ||
    isReorderPending;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
    disabled: isMutationPending,
  });

  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false);

  const toggleExpanded = () => setIsExpanded((previous) => !previous);

  const handleLabelsChange = (labelIds: string[]) =>
    assignLabels.mutate({ blockId: block.id, data: { labelIds } });

  const handleNotesCommit = (next: string[] | null) =>
    updateBlock.mutate({
      blockId: block.id,
      data: { notes: next },
    });

  const handleDeleteOpen = () => setIsDeleteOpen(true);
  const handleDeleteClose = () => setIsDeleteOpen(false);

  const handleDeleteConfirm = () => {
    deleteBlock.mutate({ blockId: block.id }, { onSuccess: () => setIsDeleteOpen(false) });
  };

  const handleDuplicate = () =>
    duplicateBlock.mutate(
      { blockId: block.id },
      { onSuccess: (created) => markCloned(created.id) },
    );

  const style = {
    transform: isDragging ? undefined : CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? DRAG_OPACITY_DRAGGING : DRAG_OPACITY_DEFAULT,
  };

  const deleteDetails =
    block.labels.length > 0
      ? block.labels.map((l) => l.name).join(LABEL_NAME_SEPARATOR)
      : EMPTY_BLOCK_LABEL;

  return (
    <Stack
      ref={(node: HTMLDivElement | null) => {
        setNodeRef(node);
        setNode(node);
      }}
      style={style}
      direction="column"
      sx={[
        (theme) => ({
          bgcolor: "background.default",
          border: 1,
          borderColor: "divider",
          borderRadius: theme.spacing(0.5),
          overflow: "hidden",
        }),
        cloneHighlightSx(isHighlighted),
      ]}
    >
      <BlockCardHead
        block={block}
        labelOptions={blockLabelOptions.options}
        isLabelsLoading={blockLabelOptions.isLoading}
        isMutationPending={isMutationPending}
        isExpanded={isExpanded}
        onToggleExpanded={toggleExpanded}
        dragAttributes={attributes}
        dragListeners={listeners}
        onLabelsChange={handleLabelsChange}
        onDeleteOpen={handleDeleteOpen}
        onDuplicate={handleDuplicate}
      />

      {isExpanded ? (
        <>
          <BlockCardNote notes={block.notes} onCommit={handleNotesCommit} />
          <BlockCardBody
            block={block}
            planId={planId}
            startDate={startDate}
            parentIsReorderPending={isMutationPending}
          />
        </>
      ) : null}

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
