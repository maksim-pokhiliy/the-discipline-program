"use client";

import { useEffect, useState } from "react";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Stack } from "@mui/material";

import { type RowItem } from "@repo/contracts/lms/row-group";

import { useReorderSchemaRows } from "@app/lib/hooks";

import { pointerFirstCollision } from "../lib/pointer-first-collision";
import { rowItemSortableId } from "../lib/row-item-sortable-id";

import { RowGroupBox } from "./row-group-box";
import { SchemaRowCard } from "./schema-row-card";

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

const itemMemberIds = (item: RowItem): string[] =>
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

  const [sortedItems, setSortedItems] = useState<RowItem[]>(items);

  useEffect(() => {
    setSortedItems(items);
  }, [items]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const effectiveReorderPending = parentIsReorderPending || reorderSchemaRows.isPending;

  const handleDragEnd = (event: DragEndEvent) => {
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

  let runningIndex = 0;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerFirstCollision}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={sortedItems.map(rowItemSortableId)}
        strategy={verticalListSortingStrategy}
      >
        <Stack sx={{ borderTop: 1, borderColor: "divider" }}>
          {sortedItems.map((item) => {
            if (item.kind === "group") {
              const startIndex = runningIndex;

              runningIndex += item.members.length;

              return (
                <RowGroupBox
                  key={rowItemSortableId(item)}
                  group={item.group}
                  members={item.members}
                  planId={planId}
                  startDate={startDate}
                  startIndex={startIndex}
                  isReorderPending={effectiveReorderPending}
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
                isSelectMode={isSelectMode}
                isSelected={selectedIds.has(item.row.id)}
                onToggleSelect={onToggleSelect}
              />
            );
          })}
        </Stack>
      </SortableContext>
    </DndContext>
  );
};
