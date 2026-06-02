"use client";

import { type ReactNode } from "react";

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
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Stack } from "@mui/material";

import type { ComposeNode, NodeId } from "../compose-tree.types";

const CHILD_SPACING = 1;

type ComposeTreeDndProps = {
  parentId: NodeId;
  nodes: ComposeNode[];
  onReorder: (parentId: NodeId, fromIndex: number, toIndex: number) => void;
  renderChild: (child: ComposeNode) => ReactNode;
};

export const ComposeTreeDnd: React.FC<ComposeTreeDndProps> = ({
  parentId,
  nodes,
  onReorder,
  renderChild,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent): void => {
    const { active, over } = event;

    if (over === null || active.id === over.id) {
      return;
    }

    const fromIndex = nodes.findIndex((child) => child.id === active.id);
    const toIndex = nodes.findIndex((child) => child.id === over.id);

    if (fromIndex < 0 || toIndex < 0) {
      return;
    }

    onReorder(parentId, fromIndex, toIndex);
  };

  if (nodes.length === 0) {
    return null;
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext
        items={nodes.map((child) => child.id)}
        strategy={verticalListSortingStrategy}
      >
        <Stack direction="column" spacing={CHILD_SPACING}>
          {nodes.map((child) => renderChild(child))}
        </Stack>
      </SortableContext>
    </DndContext>
  );
};
