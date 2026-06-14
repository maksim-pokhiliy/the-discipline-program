"use client";

import { useEffect, useState } from "react";

import {
  closestCorners,
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
import { Box, Stack } from "@mui/material";

import type { Block } from "@repo/contracts/lms/block";

import { useReorderBlocks } from "@app/lib/hooks";

import { restrictToVerticalAxis } from "../lib/restrict-to-vertical-axis";

import { AddBlockButton } from "./add-block-button";
import { BlockCard } from "./block-card";
import { DragGhost } from "./drag-ghost";

const BLOCK_LABEL_SEPARATOR = ", ";
const BLOCK_GHOST_FALLBACK = "Block";

type BlockListProps = {
  planId: string;
  startDate: string;
  sessionId: string;
  blocks: Block[];
  parentIsReorderPending?: boolean;
};

export const BlockList: React.FC<BlockListProps> = ({
  planId,
  startDate,
  sessionId,
  blocks,
  parentIsReorderPending = false,
}) => {
  const reorderBlocks = useReorderBlocks(planId, startDate, sessionId);
  const [sortedBlocks, setSortedBlocks] = useState<Block[]>(blocks);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    setSortedBlocks(blocks);
  }, [blocks]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const resolveActiveLabel = (id: string): string => {
    const block = sortedBlocks.find((b) => b.id === id);

    if (block === undefined || block.labels.length === 0) {
      return BLOCK_GHOST_FALLBACK;
    }

    return block.labels.map((label) => label.name).join(BLOCK_LABEL_SEPARATOR);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);

    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = sortedBlocks.findIndex((b) => b.id === active.id);
    const newIndex = sortedBlocks.findIndex((b) => b.id === over.id);

    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    const previousOrder = sortedBlocks;
    const nextOrder = arrayMove(sortedBlocks, oldIndex, newIndex);

    setSortedBlocks(nextOrder);
    reorderBlocks.mutate(
      { orderedIds: nextOrder.map((b) => b.id) },
      {
        onError: () => setSortedBlocks(previousOrder),
      },
    );
  };

  const effectiveBlockPending = parentIsReorderPending || reorderBlocks.isPending;

  return (
    <Stack spacing={1.25}>
      {sortedBlocks.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          modifiers={[restrictToVerticalAxis]}
          onDragStart={(event: DragStartEvent) => setActiveId(String(event.active.id))}
          onDragCancel={() => setActiveId(null)}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sortedBlocks.map((b) => b.id)}
            strategy={verticalListSortingStrategy}
          >
            <Stack spacing={1.25}>
              {sortedBlocks.map((block) => (
                <BlockCard
                  key={block.id}
                  block={block}
                  planId={planId}
                  startDate={startDate}
                  isReorderPending={effectiveBlockPending}
                />
              ))}
            </Stack>
          </SortableContext>

          <DragOverlay>
            {activeId !== null ? <DragGhost label={resolveActiveLabel(activeId)} /> : null}
          </DragOverlay>
        </DndContext>
      ) : null}

      <Box>
        <AddBlockButton planId={planId} startDate={startDate} sessionId={sessionId} />
      </Box>
    </Stack>
  );
};
