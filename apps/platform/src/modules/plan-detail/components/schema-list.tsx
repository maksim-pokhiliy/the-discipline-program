"use client";

import { type ReactNode, useEffect, useState } from "react";

import {
  closestCenter,
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

import type { SchemaWithBody } from "@repo/contracts/lms/schema";

import { useReorderSchemas } from "@app/lib/hooks";

type SchemaListProps = {
  planId: string;
  startDate: string;
  parentSchemaId: string;
  schemas: SchemaWithBody[];
  parentIsReorderPending?: boolean;
  renderItem: (schema: SchemaWithBody, effectivePending: boolean) => ReactNode;
};

export const SchemaList: React.FC<SchemaListProps> = ({
  planId,
  startDate,
  parentSchemaId,
  schemas,
  parentIsReorderPending = false,
  renderItem,
}) => {
  const reorderSchemas = useReorderSchemas(planId, startDate);
  const [sortedSchemas, setSortedSchemas] = useState<SchemaWithBody[]>(schemas);

  useEffect(() => {
    setSortedSchemas(schemas);
  }, [schemas]);

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

    const oldIndex = sortedSchemas.findIndex((s) => s.schema.id === active.id);
    const newIndex = sortedSchemas.findIndex((s) => s.schema.id === over.id);

    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    const previousOrder = sortedSchemas;
    const nextOrder = arrayMove(sortedSchemas, oldIndex, newIndex);

    setSortedSchemas(nextOrder);

    reorderSchemas.mutate(
      { parentSchemaId, orderedIds: nextOrder.map((s) => s.schema.id) },
      { onError: () => setSortedSchemas(previousOrder) },
    );
  };

  if (sortedSchemas.length === 0) {
    return null;
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext
        items={sortedSchemas.map((s) => s.schema.id)}
        strategy={verticalListSortingStrategy}
      >
        <Stack spacing={1}>
          {sortedSchemas.map((schema) => renderItem(schema, effectiveReorderPending))}
        </Stack>
      </SortableContext>
    </DndContext>
  );
};
