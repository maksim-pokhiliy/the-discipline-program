"use client";

import { useEffect, useMemo, useState } from "react";

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

import type { Block } from "@repo/contracts/lms/block";
import { buildBlockItems, type BlockItem } from "@repo/contracts/lms/schema-group";

import { useReorderSchemas } from "@app/lib/hooks";

import { blockItemSortableId } from "../lib/block-item-sortable-id";
import { pointerFirstCollision } from "../lib/pointer-first-collision";

import { AddGroupButton } from "./add-group-button";
import { AddSchemaButton } from "./add-schema-button";
import { SchemaCard } from "./schema-card";
import { SchemaGroupBox } from "./schema-group-box";

type BlockCardBodyProps = {
  block: Block;
  planId: string;
  startDate: string;
  parentIsReorderPending?: boolean;
};

const itemMemberIds = (item: BlockItem): string[] =>
  item.kind === "group" ? item.members.map((member) => member.schema.id) : [item.schema.schema.id];

export const BlockCardBody: React.FC<BlockCardBodyProps> = ({
  block,
  planId,
  startDate,
  parentIsReorderPending = false,
}) => {
  const reorderSchemas = useReorderSchemas(planId, startDate);

  const items = useMemo(
    () => buildBlockItems(block.schemas, block.groups),
    [block.schemas, block.groups],
  );
  const [sortedItems, setSortedItems] = useState<BlockItem[]>(items);

  useEffect(() => {
    setSortedItems(items);
  }, [items]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const effectiveReorderPending = parentIsReorderPending || reorderSchemas.isPending;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = sortedItems.findIndex((item) => blockItemSortableId(item) === active.id);
    const newIndex = sortedItems.findIndex((item) => blockItemSortableId(item) === over.id);

    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    const previousOrder = sortedItems;
    const nextOrder = arrayMove(sortedItems, oldIndex, newIndex);

    setSortedItems(nextOrder);

    reorderSchemas.mutate(
      { blockId: block.id, orderedIds: nextOrder.flatMap(itemMemberIds) },
      { onError: () => setSortedItems(previousOrder) },
    );
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerFirstCollision}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={sortedItems.map(blockItemSortableId)}
        strategy={verticalListSortingStrategy}
      >
        <Stack direction="column" spacing={1.25} sx={(theme) => ({ p: theme.spacing(1.5) })}>
          {sortedItems.map((item) =>
            item.kind === "group" ? (
              <SchemaGroupBox
                key={blockItemSortableId(item)}
                group={item.group}
                members={item.members}
                planId={planId}
                startDate={startDate}
                parentIsReorderPending={effectiveReorderPending}
              />
            ) : (
              <SchemaCard
                key={blockItemSortableId(item)}
                schema={item.schema}
                planId={planId}
                startDate={startDate}
                parentIsReorderPending={effectiveReorderPending}
              />
            ),
          )}

          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <AddSchemaButton planId={planId} startDate={startDate} blockId={block.id} />
            <AddGroupButton planId={planId} startDate={startDate} blockId={block.id} />
          </Stack>
        </Stack>
      </SortableContext>
    </DndContext>
  );
};
