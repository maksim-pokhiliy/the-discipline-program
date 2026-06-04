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

import type { Block } from "@repo/contracts/lms/block";
import type { SchemaWithBody } from "@repo/contracts/lms/schema";
import { AccentGroupCard } from "@repo/ui";

import { useReorderSchemas } from "@app/lib/hooks";

import { type BlockCtx } from "../lib/build-cascade-chips";
import { groupSchemasByAltGroup } from "../lib/group-schemas-by-alt-group";

import { AddComposeBlockButton } from "./add-compose-block-button";
import { AddSchemaButton } from "./add-schema-button";
import { AltGroupHeader } from "./alt-group-header";
import { SchemaCard } from "./schema-card";

const ALT_KEY_PREFIX = "ag-";
const SCHEMA_KEY_PREFIX = "sch-";

type BlockCardBodyProps = {
  block: Block;
  planId: string;
  startDate: string;
  parentIsReorderPending?: boolean;
};

export const BlockCardBody: React.FC<BlockCardBodyProps> = ({
  block,
  planId,
  startDate,
  parentIsReorderPending = false,
}) => {
  const reorderSchemas = useReorderSchemas(planId, startDate);
  const [sortedSchemas, setSortedSchemas] = useState<SchemaWithBody[]>(block.schemas);

  useEffect(() => {
    setSortedSchemas(block.schemas);
  }, [block.schemas]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const groups = useMemo(
    () => groupSchemasByAltGroup(sortedSchemas, block.alternatingGroups),
    [sortedSchemas, block.alternatingGroups],
  );

  const blockCtx = useMemo<BlockCtx>(
    () => ({ intensity: block.intensity, timeCap: block.timeCap }),
    [block.intensity, block.timeCap],
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

    const activeSchema = sortedSchemas[oldIndex];
    const overSchema = sortedSchemas[newIndex];

    if (
      activeSchema === undefined ||
      overSchema === undefined ||
      activeSchema.schema.alternatingGroupId !== overSchema.schema.alternatingGroupId
    ) {
      return;
    }

    const previousOrder = sortedSchemas;
    const nextOrder = arrayMove(sortedSchemas, oldIndex, newIndex);

    setSortedSchemas(nextOrder);

    reorderSchemas.mutate(
      { blockId: block.id, orderedIds: nextOrder.map((s) => s.schema.id) },
      { onError: () => setSortedSchemas(previousOrder) },
    );
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext
        items={sortedSchemas.map((s) => s.schema.id)}
        strategy={verticalListSortingStrategy}
      >
        <Stack direction="column" spacing={1.25} sx={(theme) => ({ p: theme.spacing(1.5) })}>
          {groups.map((g) =>
            g.kind === "alt" ? (
              <AccentGroupCard
                key={`${ALT_KEY_PREFIX}${g.group.id}`}
                header={<AltGroupHeader variantsCount={g.schemas.length} />}
              >
                <Stack spacing={1}>
                  {g.schemas.map((s) => (
                    <SchemaCard
                      key={s.schema.id}
                      schema={s}
                      planId={planId}
                      startDate={startDate}
                      blockCtx={blockCtx}
                      parentIsReorderPending={effectiveReorderPending}
                    />
                  ))}
                </Stack>
              </AccentGroupCard>
            ) : (
              <SchemaCard
                key={`${SCHEMA_KEY_PREFIX}${g.schema.schema.id}`}
                schema={g.schema}
                planId={planId}
                startDate={startDate}
                blockCtx={blockCtx}
                parentIsReorderPending={effectiveReorderPending}
              />
            ),
          )}

          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <AddSchemaButton planId={planId} startDate={startDate} blockId={block.id} />

            <AddComposeBlockButton planId={planId} startDate={startDate} blockId={block.id} />
          </Stack>
        </Stack>
      </SortableContext>
    </DndContext>
  );
};
