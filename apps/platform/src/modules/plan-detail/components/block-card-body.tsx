"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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
import { Button, Stack } from "@mui/material";
import { toast } from "sonner";

import type { Block } from "@repo/contracts/lms/block";
import { buildBlockItems, type BlockItem } from "@repo/contracts/lms/schema-group";

import { useReorderSchemas } from "@app/lib/hooks";

import { blockItemSortableId } from "../lib/block-item-sortable-id";
import { formatSchemaHeader } from "../lib/format-schema-header";
import { pointerFirstCollision } from "../lib/pointer-first-collision";
import { restrictToVerticalAxis } from "../lib/restrict-to-vertical-axis";
import { useCreateSchemaGroup } from "../lib/use-create-schema-group";

import { AddSchemaButton } from "./add-schema-button";
import { DragGhost } from "./drag-ghost";
import { GroupSelectBar } from "./group-select-bar";
import { SchemaCard } from "./schema-card";
import { SchemaGroupBox } from "./schema-group-box";

const GROUP_SCHEMAS_LABEL = "Group schemas";
const GROUP_SCHEMAS_BAR_LABEL = "Group schemas";
const MIN_GROUPABLE_SCHEMAS = 2;
const GROUP_GHOST_FALLBACK = "Group";
const SCHEMA_GHOST_FALLBACK = "Schema";
const FIRST_NOTE_INDEX = 0;

type BlockCardBodyProps = {
  block: Block;
  planId: string;
  startDate: string;
  parentIsReorderPending?: boolean;
};

const itemMemberIds = (item: BlockItem): string[] =>
  item.kind === "group" ? item.members.map((member) => member.schema.id) : [item.schema.schema.id];

const itemGhostLabel = (item: BlockItem): string => {
  if (item.kind === "group") {
    return item.group.notes?.[FIRST_NOTE_INDEX] ?? GROUP_GHOST_FALLBACK;
  }

  const header = formatSchemaHeader(item.schema);

  return header === "" ? SCHEMA_GHOST_FALLBACK : header;
};

export const BlockCardBody: React.FC<BlockCardBodyProps> = ({
  block,
  planId,
  startDate,
  parentIsReorderPending = false,
}) => {
  const reorderSchemas = useReorderSchemas(planId, startDate);
  const createSchemaGroup = useCreateSchemaGroup(planId, startDate);

  const items = useMemo(
    () => buildBlockItems(block.schemas, block.groups),
    [block.schemas, block.groups],
  );
  const [sortedItems, setSortedItems] = useState<BlockItem[]>(items);
  const [isSelectMode, setIsSelectMode] = useState<boolean>(false);
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(() => new Set());
  const [activeId, setActiveId] = useState<string | null>(null);
  const isFiredRef = useRef(false);

  useEffect(() => {
    setSortedItems(items);
  }, [items]);

  const ungroupedCount = useMemo(
    () => block.schemas.filter((entry) => entry.schema.groupId === null).length,
    [block.schemas],
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const effectiveReorderPending = parentIsReorderPending || reorderSchemas.isPending;

  const resolveActiveLabel = (id: string): string => {
    const item = sortedItems.find((entry) => blockItemSortableId(entry) === id);

    return item === undefined ? SCHEMA_GHOST_FALLBACK : itemGhostLabel(item);
  };

  const exitSelectMode = () => {
    setIsSelectMode(false);
    setSelectedIds(new Set());
  };

  const toggleSelected = (schemaId: string) =>
    setSelectedIds((current) => {
      const next = new Set(current);

      if (next.has(schemaId)) {
        next.delete(schemaId);
      } else {
        next.add(schemaId);
      }

      return next;
    });

  const handleGroup = () => {
    if (isFiredRef.current || createSchemaGroup.isPending) {
      return;
    }

    isFiredRef.current = true;
    void createSchemaGroup
      .run(
        { blockId: block.id, schemas: block.schemas, selectedIds },
        { onSuccess: exitSelectMode, onError: (message) => toast.error(message) },
      )
      .finally(() => {
        isFiredRef.current = false;
      });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);

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

  const handleMemberReorder = (
    groupId: string,
    orderedMemberIds: string[],
    options: { onError: () => void },
  ) => {
    const orderedIds = sortedItems.flatMap((item) =>
      item.kind === "group" && item.group.id === groupId ? orderedMemberIds : itemMemberIds(item),
    );

    reorderSchemas.mutate({ blockId: block.id, orderedIds }, { onError: options.onError });
  };

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
                onMemberReorder={handleMemberReorder}
              />
            ) : (
              <SchemaCard
                key={blockItemSortableId(item)}
                schema={item.schema}
                planId={planId}
                startDate={startDate}
                parentIsReorderPending={effectiveReorderPending}
                isDraggable={!isSelectMode}
                isSelectMode={isSelectMode}
                isSelected={selectedIds.has(item.schema.schema.id)}
                onToggleSelect={toggleSelected}
              />
            ),
          )}

          {isSelectMode ? (
            <GroupSelectBar
              selectedCount={selectedIds.size}
              isPending={createSchemaGroup.isPending}
              onCancel={exitSelectMode}
              onGroup={handleGroup}
              groupLabel={GROUP_SCHEMAS_BAR_LABEL}
            />
          ) : null}

          <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
            <AddSchemaButton planId={planId} startDate={startDate} blockId={block.id} />

            {!isSelectMode && ungroupedCount >= MIN_GROUPABLE_SCHEMAS ? (
              <Button
                size="tiny"
                variant="text"
                onClick={() => setIsSelectMode(true)}
                sx={{ alignSelf: "flex-start" }}
              >
                {GROUP_SCHEMAS_LABEL}
              </Button>
            ) : null}
          </Stack>
        </Stack>
      </SortableContext>

      <DragOverlay>
        {activeId !== null ? <DragGhost label={resolveActiveLabel(activeId)} /> : null}
      </DragOverlay>
    </DndContext>
  );
};
