"use client";

import { useEffect, useState } from "react";

import {
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
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Stack } from "@mui/material";

import { type RowItem } from "@repo/contracts/lms/row-group";

import { useCatalog, useReorderSchemaRows } from "@app/lib/hooks";

import { formatRow } from "../lib/format-row";
import { pointerFirstCollision } from "../lib/pointer-first-collision";
import { restrictToVerticalAxis } from "../lib/restrict-to-vertical-axis";
import { rowItemSortableId } from "../lib/row-item-sortable-id";

import { DragGhost } from "./drag-ghost";
import { RowGroupBox } from "./row-group-box";
import { SchemaRowCard } from "./schema-row-card";

const ROW_GROUP_GHOST_FALLBACK = "Group";
const ROW_GHOST_FALLBACK = "Row";
const FIRST_NOTE_INDEX = 0;
const GHOST_INDEX = 0;

type SchemaRowListBodyProps = {
  schemaId: string;
  planId: string;
  startDate: string;
  items: RowItem[];
  minuteLabelById: Map<string, string>;
  parentIsReorderPending: boolean;
  isSelectMode: boolean;
  selectedIds: ReadonlySet<string>;
  onToggleSelect: (rowId: string) => void;
};

export const itemMemberIds = (item: RowItem): string[] =>
  item.kind === "group" ? item.members.map((member) => member.id) : [item.row.id];

export const SchemaRowListBody: React.FC<SchemaRowListBodyProps> = ({
  schemaId,
  planId,
  startDate,
  items,
  minuteLabelById,
  parentIsReorderPending,
  isSelectMode,
  selectedIds,
  onToggleSelect,
}) => {
  const reorderSchemaRows = useReorderSchemaRows(planId, startDate);
  const { exerciseById } = useCatalog();

  const [sortedItems, setSortedItems] = useState<RowItem[]>(items);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    setSortedItems(items);
  }, [items]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const effectiveReorderPending = parentIsReorderPending || reorderSchemaRows.isPending;

  const resolveActiveLabel = (id: string): string => {
    const item = sortedItems.find((entry) => rowItemSortableId(entry) === id);

    if (item === undefined) {
      return ROW_GHOST_FALLBACK;
    }

    if (item.kind === "group") {
      return item.group.notes?.[FIRST_NOTE_INDEX] ?? ROW_GROUP_GHOST_FALLBACK;
    }

    const mainText = formatRow(item.row, exerciseById, GHOST_INDEX).mainText;

    return mainText === "" ? ROW_GHOST_FALLBACK : mainText;
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);

    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = sortedItems.findIndex((item) => rowItemSortableId(item) === active.id);
    const newIndex = sortedItems.findIndex((item) => rowItemSortableId(item) === over.id);

    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    const previousOrder = sortedItems;
    const nextOrder = arrayMove(sortedItems, oldIndex, newIndex);

    setSortedItems(nextOrder);

    reorderSchemaRows.mutate(
      { schemaId, orderedIds: nextOrder.flatMap(itemMemberIds) },
      { onError: () => setSortedItems(previousOrder) },
    );
  };

  const handleMemberReorder = (
    rowGroupId: string,
    orderedMemberIds: string[],
    options: { onError: () => void },
  ) => {
    const orderedIds = sortedItems.flatMap((item) =>
      item.kind === "group" && item.group.id === rowGroupId
        ? orderedMemberIds
        : itemMemberIds(item),
    );

    reorderSchemaRows.mutate({ schemaId, orderedIds }, { onError: options.onError });
  };

  let runningIndex = 0;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerFirstCollision}
      modifiers={[restrictToVerticalAxis]}
      onDragStart={(event: DragStartEvent) => setActiveId(String(event.active.id))}
      onDragCancel={() => setActiveId(null)}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={sortedItems.map(rowItemSortableId)}
        strategy={verticalListSortingStrategy}
      >
        <Stack sx={{ borderTop: 1, borderColor: "divider" }}>
          {sortedItems.map((item) => {
            if (item.kind === "group") {
              const ord = runningIndex + 1;

              runningIndex += 1;

              return (
                <RowGroupBox
                  key={rowItemSortableId(item)}
                  group={item.group}
                  members={item.members}
                  planId={planId}
                  startDate={startDate}
                  ord={ord}
                  isReorderPending={effectiveReorderPending}
                  onMemberReorder={handleMemberReorder}
                  minuteLabelById={minuteLabelById}
                />
              );
            }

            const index = runningIndex;

            runningIndex += 1;

            return (
              <SchemaRowCard
                key={rowItemSortableId(item)}
                row={item.row}
                planId={planId}
                startDate={startDate}
                index={index}
                minuteLabel={minuteLabelById.get(item.row.id) ?? null}
                isReorderPending={effectiveReorderPending}
                isDraggable={!isSelectMode}
                isSelectMode={isSelectMode}
                isSelected={selectedIds.has(item.row.id)}
                onToggleSelect={onToggleSelect}
              />
            );
          })}
        </Stack>
      </SortableContext>

      <DragOverlay>
        {activeId !== null ? <DragGhost label={resolveActiveLabel(activeId)} /> : null}
      </DragOverlay>
    </DndContext>
  );
};
