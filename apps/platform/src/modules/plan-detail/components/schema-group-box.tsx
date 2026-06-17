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

import type { Intensity } from "@repo/contracts/lms/_shared";
import type { SchemaWithBody } from "@repo/contracts/lms/schema";
import { type ParallelInterleaveOrder, type SchemaGroup } from "@repo/contracts/lms/schema-group";
import { ConfirmationModal } from "@repo/ui";

import { useDeleteGroup, useUpdateGroup } from "@app/lib/hooks";

import { groupSortableId, schemaSortableId } from "../lib/block-item-sortable-id";
import { formatSchemaHeader } from "../lib/format-schema-header";
import { restrictToVerticalAxis } from "../lib/restrict-to-vertical-axis";
import { useDeleteGroupWithMembers } from "../lib/use-delete-group-with-members";

import { AddTrackButton } from "./add-track-button";
import { DragGhost } from "./drag-ghost";
import { GroupTrackWrapper } from "./group-track-wrapper";
import { SchemaGroupBoxHead } from "./schema-group-box-head";

const GROUP_BOX_TEST_ID = "schema-group-box";
const FRAME_BORDER_ALPHA = 0.35;
const FRAME_BG_ALPHA = 0.03;
const FRAME_BORDER_RADIUS_FACTOR = 0.5;
const TRACK_GAP_FACTOR = 1;
const TRACKS_PADDING_BLOCK_FACTOR = 1.5;
const TRACKS_PADDING_RAIL_FACTOR = 1.25;
const FOOTER_PADDING_X_FACTOR = 1.5;
const FOOTER_PADDING_BOTTOM_FACTOR = 1.5;
const DRAG_OPACITY_DRAGGING = 0.5;
const DRAG_OPACITY_DEFAULT = 1;
const MEMBER_GHOST_FALLBACK = "Schema";

const UNGROUP_TITLE = "Ungroup";
const UNGROUP_MESSAGE = "Ungroup these tracks? Schemas stay in the block as standalone.";
const UNGROUP_CONFIRM = "Ungroup";
const DELETE_TITLE = "Delete group";
const DELETE_MESSAGE = "Delete the group AND its member schemas?";

const FIRST_NOTE_INDEX = 0;

type SchemaGroupBoxProps = {
  group: SchemaGroup;
  members: SchemaWithBody[];
  planId: string;
  startDate: string;
  blockIntensity?: Intensity | null;
  parentIsReorderPending?: boolean;
  onMemberReorder: (
    groupId: string,
    orderedMemberIds: string[],
    options: { onError: () => void },
  ) => void;
};

export const SchemaGroupBox: React.FC<SchemaGroupBoxProps> = ({
  group,
  members,
  planId,
  startDate,
  blockIntensity = null,
  parentIsReorderPending = false,
  onMemberReorder,
}): ReactElement => {
  const updateGroup = useUpdateGroup(planId, startDate);
  const deleteGroup = useDeleteGroup(planId, startDate);
  const deleteGroupWithMembers = useDeleteGroupWithMembers(planId, startDate);

  const [isUngroupOpen, setIsUngroupOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [sortedMembers, setSortedMembers] = useState<SchemaWithBody[]>(members);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => setIsExpanded((previous) => !previous);

  useEffect(() => {
    setSortedMembers(members);
  }, [members]);

  const memberSensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: groupSortableId(group.id),
    disabled: parentIsReorderPending,
  });

  const style = {
    transform: isDragging ? undefined : CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? DRAG_OPACITY_DRAGGING : DRAG_OPACITY_DEFAULT,
  };

  const currentLabel = group.notes?.[FIRST_NOTE_INDEX] ?? null;

  const resolveActiveLabel = (id: string): string => {
    const member = sortedMembers.find((entry) => schemaSortableId(entry.schema.id) === id);

    if (member === undefined) {
      return MEMBER_GHOST_FALLBACK;
    }

    const header = formatSchemaHeader(member);

    return header === "" ? MEMBER_GHOST_FALLBACK : header;
  };

  const handleLabelCommit = (next: string) => {
    const trimmed = next.trim();
    const nextLabel = trimmed === "" ? null : trimmed;

    if (nextLabel === currentLabel) {
      return;
    }

    updateGroup.mutate({
      groupId: group.id,
      data: { notes: nextLabel === null ? null : [nextLabel] },
    });
  };

  const handleInterleaveChange = (next: ParallelInterleaveOrder) => {
    if (next === group.interleaveOrder) {
      return;
    }

    updateGroup.mutate({ groupId: group.id, data: { interleaveOrder: next } });
  };

  const handleMemberDragEnd = (event: DragEndEvent) => {
    setActiveId(null);

    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = sortedMembers.findIndex(
      (member) => schemaSortableId(member.schema.id) === active.id,
    );
    const newIndex = sortedMembers.findIndex(
      (member) => schemaSortableId(member.schema.id) === over.id,
    );

    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    const previousMembers = sortedMembers;
    const nextMembers = arrayMove(sortedMembers, oldIndex, newIndex);

    setSortedMembers(nextMembers);
    onMemberReorder(
      group.id,
      nextMembers.map((member) => member.schema.id),
      { onError: () => setSortedMembers(previousMembers) },
    );
  };

  const handleUngroupConfirm = () =>
    deleteGroup.mutate({ groupId: group.id }, { onSuccess: () => setIsUngroupOpen(false) });

  const handleDeleteConfirm = async () => {
    await deleteGroupWithMembers.run({ members });
    setIsDeleteOpen(false);
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      data-testid={GROUP_BOX_TEST_ID}
      sx={(theme) => ({
        border: `1px solid ${alpha(theme.palette.primary.main, FRAME_BORDER_ALPHA)}`,
        borderRadius: theme.spacing(FRAME_BORDER_RADIUS_FACTOR),
        bgcolor: alpha(theme.palette.primary.main, FRAME_BG_ALPHA),
        overflow: "hidden",
      })}
    >
      <SchemaGroupBoxHead
        group={group}
        isUpdatePending={updateGroup.isPending}
        isExpanded={isExpanded}
        onToggleExpanded={toggleExpanded}
        dragAttributes={attributes}
        dragListeners={listeners}
        onLabelCommit={handleLabelCommit}
        onInterleaveChange={handleInterleaveChange}
        onUngroupOpen={() => setIsUngroupOpen(true)}
        onDeleteOpen={() => setIsDeleteOpen(true)}
      />

      {isExpanded ? (
        <>
          <DndContext
            sensors={memberSensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragStart={(event: DragStartEvent) => setActiveId(String(event.active.id))}
            onDragCancel={() => setActiveId(null)}
            onDragEnd={handleMemberDragEnd}
          >
            <SortableContext
              items={sortedMembers.map((member) => schemaSortableId(member.schema.id))}
              strategy={verticalListSortingStrategy}
            >
              <Stack
                direction="column"
                spacing={TRACK_GAP_FACTOR}
                sx={(theme) => ({
                  p: theme.spacing(
                    TRACKS_PADDING_BLOCK_FACTOR,
                    TRACKS_PADDING_BLOCK_FACTOR,
                    TRACKS_PADDING_BLOCK_FACTOR,
                    TRACKS_PADDING_RAIL_FACTOR,
                  ),
                })}
              >
                {sortedMembers.map((member) => (
                  <GroupTrackWrapper
                    key={member.schema.id}
                    member={member}
                    planId={planId}
                    startDate={startDate}
                    blockIntensity={blockIntensity}
                    parentIsReorderPending={parentIsReorderPending}
                  />
                ))}
              </Stack>
            </SortableContext>

            <DragOverlay>
              {activeId !== null ? <DragGhost label={resolveActiveLabel(activeId)} /> : null}
            </DragOverlay>
          </DndContext>

          <Box sx={{ px: FOOTER_PADDING_X_FACTOR, pb: FOOTER_PADDING_BOTTOM_FACTOR, pt: 0 }}>
            <AddTrackButton
              planId={planId}
              startDate={startDate}
              blockId={group.blockId}
              groupId={group.id}
            />
          </Box>
        </>
      ) : null}

      <ConfirmationModal
        open={isUngroupOpen}
        onClose={() => setIsUngroupOpen(false)}
        title={UNGROUP_TITLE}
        type="warning"
        message={UNGROUP_MESSAGE}
        confirmText={UNGROUP_CONFIRM}
        onConfirm={handleUngroupConfirm}
        isConfirming={deleteGroup.isPending}
      />

      <ConfirmationModal
        open={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title={DELETE_TITLE}
        type="danger"
        message={DELETE_MESSAGE}
        onConfirm={handleDeleteConfirm}
        isConfirming={deleteGroupWithMembers.isPending}
      />
    </Box>
  );
};
