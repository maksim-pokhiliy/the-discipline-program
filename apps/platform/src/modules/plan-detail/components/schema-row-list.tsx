"use client";

import { useEffect, useMemo, useState } from "react";

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

import type { Composition } from "@repo/contracts/lms/composition";
import type { SchemaRow } from "@repo/contracts/lms/schema-row";

import { useReorderSchemaRows } from "@app/lib/hooks";

import { deriveMinuteView } from "../lib/derive-minute-view";

import { AddRowButton } from "./add-row-button";
import { SchemaRowCard } from "./schema-row-card";

type SchemaRowListProps = {
  planId: string;
  startDate: string;
  schemaId: string;
  rows: SchemaRow[];
  composition?: Composition | null;
  parentIsReorderPending?: boolean;
};

export const SchemaRowList: React.FC<SchemaRowListProps> = ({
  planId,
  startDate,
  schemaId,
  rows,
  composition = null,
  parentIsReorderPending = false,
}) => {
  const reorderSchemaRows = useReorderSchemaRows(planId, startDate);
  const [sortedRows, setSortedRows] = useState<SchemaRow[]>(rows);

  useEffect(() => {
    setSortedRows(rows);
  }, [rows]);

  const minuteLabelById = useMemo<Map<string, string>>(() => {
    if (composition === null) {
      return new Map();
    }

    const view = deriveMinuteView(
      composition,
      sortedRows.map((row) => row.id),
    );

    if (view.kind === "none") {
      return new Map();
    }

    return new Map(
      view.assignments.map((assignment) => [assignment.rowId, assignment.minuteLabel]),
    );
  }, [composition, sortedRows]);

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
                  minuteLabel={minuteLabelById.get(row.id) ?? null}
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
