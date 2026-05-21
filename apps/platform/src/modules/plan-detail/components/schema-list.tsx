"use client";

import { useEffect, useState } from "react";

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
import { Box, Stack } from "@mui/material";

import type { SchemaWithBody } from "@repo/contracts/lms/schema";

import { useReorderSchemas } from "@app/lib/hooks";

import { AddSchemaButton } from "./add-schema-button";
import { SchemaCard } from "./schema-card";

type SchemaListProps = {
  planId: string;
  startDate: string;
  blockId: string;
  schemas: SchemaWithBody[];
};

export const SchemaList: React.FC<SchemaListProps> = ({ planId, startDate, blockId, schemas }) => {
  const reorderSchemas = useReorderSchemas(planId, startDate);
  const [sortedSchemas, setSortedSchemas] = useState<SchemaWithBody[]>(schemas);

  useEffect(() => {
    setSortedSchemas(schemas);
  }, [schemas]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

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
      { blockId, orderedIds: nextOrder.map((s) => s.schema.id) },
      {
        onError: () => setSortedSchemas(previousOrder),
      },
    );
  };

  return (
    <Stack spacing={1}>
      {sortedSchemas.length > 0 ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={sortedSchemas.map((s) => s.schema.id)}
            strategy={verticalListSortingStrategy}
          >
            <Stack spacing={1}>
              {sortedSchemas.map((schema) => (
                <SchemaCard
                  key={schema.schema.id}
                  schema={schema}
                  planId={planId}
                  startDate={startDate}
                />
              ))}
            </Stack>
          </SortableContext>
        </DndContext>
      ) : null}

      <Box>
        <AddSchemaButton planId={planId} startDate={startDate} blockId={blockId} />
      </Box>
    </Stack>
  );
};
