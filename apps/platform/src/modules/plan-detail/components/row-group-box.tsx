"use client";

import { type ReactElement, useState } from "react";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Box, Stack, alpha } from "@mui/material";

import type { RowGroup } from "@repo/contracts/lms/row-group";
import type { SchemaRow } from "@repo/contracts/lms/schema-row";
import { ConfirmationModal } from "@repo/ui";

import { useDeleteRowGroup, useUpdateRowGroup } from "@app/lib/hooks";

import { rowGroupSortableId } from "../lib/row-item-sortable-id";
import { useDeleteRowGroupWithMembers } from "../lib/use-delete-row-group-with-members";

import { RowGroupBoxHead } from "./row-group-box-head";
import { SchemaRowCard } from "./schema-row-card";

const ROW_GROUP_BOX_TEST_ID = "row-group-box";
const FRAME_BORDER_ALPHA = 0.35;
const FRAME_BG_ALPHA = 0.03;
const FIRST_NOTE_INDEX = 0;
const DRAG_OPACITY_DRAGGING = 0.5;
const DRAG_OPACITY_DEFAULT = 1;

const UNGROUP_TITLE = "Ungroup";
const UNGROUP_MESSAGE = "Ungroup these rows? They stay in the schema as standalone rows.";
const UNGROUP_CONFIRM = "Ungroup";
const DELETE_TITLE = "Delete group";
const DELETE_MESSAGE = "Delete the group AND its member rows?";

type RowGroupBoxProps = {
  group: RowGroup;
  members: SchemaRow[];
  planId: string;
  startDate: string;
  startIndex: number;
  isReorderPending: boolean;
};

export const RowGroupBox: React.FC<RowGroupBoxProps> = ({
  group,
  members,
  planId,
  startDate,
  startIndex,
  isReorderPending,
}): ReactElement => {
  const updateRowGroup = useUpdateRowGroup(planId, startDate);
  const deleteRowGroup = useDeleteRowGroup(planId, startDate);
  const deleteRowGroupWithMembers = useDeleteRowGroupWithMembers(planId, startDate);

  const [isUngroupOpen, setIsUngroupOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: rowGroupSortableId(group.id),
    disabled: isReorderPending,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? DRAG_OPACITY_DRAGGING : DRAG_OPACITY_DEFAULT,
  };

  const currentLabel = group.notes?.[FIRST_NOTE_INDEX] ?? null;

  const handleLabelCommit = (next: string) => {
    const trimmed = next.trim();
    const nextLabel = trimmed === "" ? null : trimmed;

    if (nextLabel === currentLabel) {
      return;
    }

    updateRowGroup.mutate({
      rowGroupId: group.id,
      data: { notes: nextLabel === null ? null : [nextLabel] },
    });
  };

  const handleUngroupConfirm = () =>
    deleteRowGroup.mutate({ rowGroupId: group.id }, { onSuccess: () => setIsUngroupOpen(false) });

  const handleDeleteConfirm = async () => {
    await deleteRowGroupWithMembers.run({ members });
    setIsDeleteOpen(false);
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      data-testid={ROW_GROUP_BOX_TEST_ID}
      sx={(theme) => ({
        border: `1px solid ${alpha(theme.palette.primary.main, FRAME_BORDER_ALPHA)}`,
        bgcolor: alpha(theme.palette.primary.main, FRAME_BG_ALPHA),
        overflow: "hidden",
      })}
    >
      <RowGroupBoxHead
        group={group}
        isUpdatePending={updateRowGroup.isPending}
        dragAttributes={attributes}
        dragListeners={listeners}
        onLabelCommit={handleLabelCommit}
        onUngroupOpen={() => setIsUngroupOpen(true)}
        onDeleteOpen={() => setIsDeleteOpen(true)}
      />

      <Stack>
        {members.map((member, offset) => (
          <SchemaRowCard
            key={member.id}
            row={member}
            planId={planId}
            startDate={startDate}
            index={startIndex + offset}
            isReorderPending={isReorderPending}
            isDraggable={false}
          />
        ))}
      </Stack>

      <ConfirmationModal
        open={isUngroupOpen}
        onClose={() => setIsUngroupOpen(false)}
        title={UNGROUP_TITLE}
        type="warning"
        message={UNGROUP_MESSAGE}
        confirmText={UNGROUP_CONFIRM}
        onConfirm={handleUngroupConfirm}
        isConfirming={deleteRowGroup.isPending}
      />

      <ConfirmationModal
        open={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title={DELETE_TITLE}
        type="danger"
        message={DELETE_MESSAGE}
        onConfirm={handleDeleteConfirm}
        isConfirming={deleteRowGroupWithMembers.isPending}
      />
    </Box>
  );
};
