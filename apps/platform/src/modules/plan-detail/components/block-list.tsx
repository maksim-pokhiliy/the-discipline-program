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

import type { Block } from "@repo/contracts/lms/block";

import { useReorderBlocks } from "@app/lib/hooks";

import { AddBlockButton } from "./add-block-button";
import { BlockCard } from "./block-card";

type BlockListProps = {
  planId: string;
  startDate: string;
  sessionId: string;
  blocks: Block[];
};

export const BlockList: React.FC<BlockListProps> = ({ planId, startDate, sessionId, blocks }) => {
  const reorderBlocks = useReorderBlocks(planId, startDate, sessionId);
  const [sortedBlocks, setSortedBlocks] = useState<Block[]>(blocks);

  useEffect(() => {
    setSortedBlocks(blocks);
  }, [blocks]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
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

  return (
    <Stack spacing={1}>
      {sortedBlocks.length > 0 ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={sortedBlocks.map((b) => b.id)}
            strategy={verticalListSortingStrategy}
          >
            <Stack spacing={1}>
              {sortedBlocks.map((block) => (
                <BlockCard key={block.id} block={block} planId={planId} startDate={startDate} />
              ))}
            </Stack>
          </SortableContext>
        </DndContext>
      ) : null}

      <Box>
        <AddBlockButton planId={planId} startDate={startDate} sessionId={sessionId} />
      </Box>
    </Stack>
  );
};
