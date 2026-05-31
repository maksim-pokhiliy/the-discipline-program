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

import type { SchemaRow } from "@repo/contracts/lms/schema-row";

import { useReorderSchemaRows } from "@app/lib/hooks";

import { AddRowButton } from "./add-row-button";
import { SchemaRowCard } from "./schema-row-card";

type SchemaRowListProps = {
  planId: string;
  startDate: string;
  schemaId: string;
  rows: SchemaRow[];
  parentIsReorderPending?: boolean;
};

export const SchemaRowList: React.FC<SchemaRowListProps> = ({
  planId,
  startDate,
  schemaId,
  rows,
  parentIsReorderPending = false,
}) => {
  const reorderSchemaRows = useReorderSchemaRows(planId, startDate);
  const [sortedRows, setSortedRows] = useState<SchemaRow[]>(rows);

  useEffect(() => {
    setSortedRows(rows);
  }, [rows]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = sortedRows.findIndex((r) => r.id === active.id);
    const newIndex = sortedRows.findIndex((r) => r.id === over.id);

    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    const previousOrder = sortedRows;
    const nextOrder = arrayMove(sortedRows, oldIndex, newIndex);

    setSortedRows(nextOrder);
    reorderSchemaRows.mutate(
      { schemaId, orderedIds: nextOrder.map((r) => r.id) },
      {
        onError: () => setSortedRows(previousOrder),
      },
    );
  };

  return (
    <Stack direction="column">
      {sortedRows.length > 0 ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={sortedRows.map((r) => r.id)}
            strategy={verticalListSortingStrategy}
          >
            <Stack sx={{ borderTop: 1, borderColor: "divider" }}>
              {sortedRows.map((row, index) => (
                <SchemaRowCard
                  key={row.id}
                  row={row}
                  planId={planId}
                  startDate={startDate}
                  index={index}
                  isReorderPending={parentIsReorderPending || reorderSchemaRows.isPending}
                />
              ))}
            </Stack>
          </SortableContext>
        </DndContext>
      ) : null}

      <Stack
        sx={(theme) => ({
          p: theme.spacing(1),
        })}
      >
        <AddRowButton schemaId={schemaId} planId={planId} startDate={startDate} />
      </Stack>
    </Stack>
  );
};
