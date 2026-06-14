"use client";

import { type ReactElement, useEffect, useState } from "react";

import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Box, Stack, alpha } from "@mui/material";

import type { RowGroup } from "@repo/contracts/lms/row-group";
import type { SchemaRow } from "@repo/contracts/lms/schema-row";
import { ConfirmationModal } from "@repo/ui";

import { useCatalog, useDeleteRowGroup, useUpdateRowGroup } from "@app/lib/hooks";

import { formatRow } from "../lib/format-row";
import { restrictToVerticalAxis } from "../lib/restrict-to-vertical-axis";
import { rowGroupSortableId, rowSortableId } from "../lib/row-item-sortable-id";
import { useDeleteRowGroupWithMembers } from "../lib/use-delete-row-group-with-members";

import { DragGhost } from "./drag-ghost";
import { RowGroupBoxHead } from "./row-group-box-head";
import { SchemaRowCard } from "./schema-row-card";

const ROW_GROUP_BOX_TEST_ID = "row-group-box";
const FRAME_BORDER_ALPHA = 0.35;
const FRAME_BG_ALPHA = 0.03;
const FIRST_NOTE_INDEX = 0;
const DRAG_OPACITY_DRAGGING = 0.5;
const DRAG_OPACITY_DEFAULT = 1;
const MEMBER_GHOST_FALLBACK = "Row";
const GHOST_INDEX = 0;

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
  onMemberReorder: (
    rowGroupId: string,
    orderedMemberIds: string[],
    options: { onError: () => void },
  ) => void;
};

export const RowGroupBox: React.FC<RowGroupBoxProps> = ({
  group,
  members,
  planId,
  startDate,
  startIndex,
  isReorderPending,
  onMemberReorder,
}): ReactElement => {
  const updateRowGroup = useUpdateRowGroup(planId, startDate);
  const deleteRowGroup = useDeleteRowGroup(planId, startDate);
  const deleteRowGroupWithMembers = useDeleteRowGroupWithMembers(planId, startDate);
  const { exerciseById } = useCatalog();

  const [isUngroupOpen, setIsUngroupOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [sortedMembers, setSortedMembers] = useState<SchemaRow[]>(members);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    setSortedMembers(members);
  }, [members]);

  const memberSensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: rowGroupSortableId(group.id),
    disabled: isReorderPending,
  });

  const style = {
    transform: isDragging ? undefined : CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? DRAG_OPACITY_DRAGGING : DRAG_OPACITY_DEFAULT,
  };

  const currentLabel = group.notes?.[FIRST_NOTE_INDEX] ?? null;

  const resolveActiveLabel = (id: string): string => {
    const member = sortedMembers.find((entry) => rowSortableId(entry.id) === id);

    if (member === undefined) {
      return MEMBER_GHOST_FALLBACK;
    }

    const mainText = formatRow(member, exerciseById, GHOST_INDEX).mainText;

    return mainText === "" ? MEMBER_GHOST_FALLBACK : mainText;
  };

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

  const handleMemberDragEnd = (event: DragEndEvent) => {
    setActiveId(null);

    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = sortedMembers.findIndex((member) => rowSortableId(member.id) === active.id);
    const newIndex = sortedMembers.findIndex((member) => rowSortableId(member.id) === over.id);

    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    const previousMembers = sortedMembers;
    const nextMembers = arrayMove(sortedMembers, oldIndex, newIndex);

    setSortedMembers(nextMembers);
    onMemberReorder(
      group.id,
      nextMembers.map((member) => member.id),
      { onError: () => setSortedMembers(previousMembers) },
    );
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

      <DndContext
        sensors={memberSensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis]}
        onDragStart={(event: DragStartEvent) => setActiveId(String(event.active.id))}
        onDragCancel={() => setActiveId(null)}
        onDragEnd={handleMemberDragEnd}
      >
        <SortableContext
          items={sortedMembers.map((member) => rowSortableId(member.id))}
          strategy={verticalListSortingStrategy}
        >
          <Stack>
            {sortedMembers.map((member, offset) => (
              <SchemaRowCard
                key={member.id}
                row={member}
                planId={planId}
                startDate={startDate}
                index={startIndex + offset}
                isReorderPending={isReorderPending}
                isDraggable
              />
            ))}
          </Stack>
        </SortableContext>

        <DragOverlay>
          {activeId !== null ? <DragGhost label={resolveActiveLabel(activeId)} /> : null}
        </DragOverlay>
      </DndContext>

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
