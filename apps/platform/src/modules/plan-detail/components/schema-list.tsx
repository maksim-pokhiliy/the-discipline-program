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
import { Stack } from "@mui/material";

import type { Exercise } from "@repo/contracts/lms/exercise";
import type { SchemaWithBody } from "@repo/contracts/lms/schema";

import { useReorderSchemas } from "@app/lib/hooks";

import { type BlockCtx } from "../lib/build-cascade-chips";

import { SchemaCard } from "./schema-card";

type SchemaListParent =
  | { kind: "block"; blockId: string; allBlockSchemas: SchemaWithBody[] }
  | { kind: "schema"; parentSchemaId: string };

type SchemaListProps = {
  planId: string;
  startDate: string;
  parent: SchemaListParent;
  schemas: SchemaWithBody[];
  blockCtx: BlockCtx;
  exerciseById: ReadonlyMap<string, Exercise>;
  parentIsReorderPending?: boolean;
};

const buildFullBlockOrderedIds = (
  allBlockSchemas: SchemaWithBody[],
  visibleSchemas: SchemaWithBody[],
  nextVisibleOrder: SchemaWithBody[],
): string[] => {
  const visibleIdSet = new Set(visibleSchemas.map((s) => s.schema.id));
  let cursor = 0;

  return allBlockSchemas.map((s) => {
    if (!visibleIdSet.has(s.schema.id)) {
      return s.schema.id;
    }

    const candidate = nextVisibleOrder[cursor];

    if (candidate === undefined) {
      throw new Error("invariant: nextVisibleOrder shorter than visible subset");
    }

    cursor += 1;

    return candidate.schema.id;
  });
};

export const SchemaList: React.FC<SchemaListProps> = ({
  planId,
  startDate,
  parent,
  schemas,
  blockCtx,
  exerciseById,
  parentIsReorderPending = false,
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

    if (parent.kind === "block") {
      const fullBlockOrderedIds = buildFullBlockOrderedIds(
        parent.allBlockSchemas,
        sortedSchemas,
        nextOrder,
      );

      reorderSchemas.mutate(
        { blockId: parent.blockId, orderedIds: fullBlockOrderedIds },
        { onError: () => setSortedSchemas(previousOrder) },
      );

      return;
    }

    reorderSchemas.mutate(
      {
        parentSchemaId: parent.parentSchemaId,
        orderedIds: nextOrder.map((s) => s.schema.id),
      },
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
          {sortedSchemas.map((schema) => (
            <SchemaCard
              key={schema.schema.id}
              schema={schema}
              planId={planId}
              startDate={startDate}
              blockCtx={blockCtx}
              exerciseById={exerciseById}
              parentIsReorderPending={effectiveReorderPending}
            />
          ))}
        </Stack>
      </SortableContext>
    </DndContext>
  );
};
