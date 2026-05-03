"use client";

import { type ReactNode } from "react";

import { DndContext, closestCenter, DragOverlay } from "@dnd-kit/core";
import { Box } from "@mui/material";
import { useSearchParams } from "next/navigation";

import { usePlanStructure } from "@app/lib/hooks";

import { usePlanCanvasDnd } from "./plan-canvas/use-plan-canvas-dnd";
import { PlanHistoryProvider, useHistoryKeybindings, usePlanHistory } from "./undo-redo";

type PlanEditorDndProviderProps = {
  planId: string;
  children: ReactNode;
};

export const PlanEditorDndProvider = ({ planId, children }: PlanEditorDndProviderProps) => {
  const searchParams = useSearchParams();
  const fromParam = searchParams.get("fromWeek");
  const toParam = searchParams.get("toWeek");
  const fromWeek = fromParam !== null ? Number(fromParam) : undefined;
  const toWeek = toParam !== null ? Number(toParam) : undefined;

  const { data } = usePlanStructure(planId, { fromWeek, toWeek });

  const history = usePlanHistory(planId);
  const dnd = usePlanCanvasDnd(planId, data, history);

  useHistoryKeybindings({ history });

  return (
    <PlanHistoryProvider history={history}>
      <DndContext
        sensors={dnd.sensors}
        collisionDetection={closestCenter}
        onDragStart={dnd.onDragStart}
        onDragEnd={dnd.onDragEnd}
      >
        {children}

        <Box
          aria-live="polite"
          aria-atomic="true"
          sx={{ position: "absolute", left: -10000, top: "auto", width: 1, height: 1 }}
        >
          {dnd.announcement}
        </Box>

        <DragOverlay />
      </DndContext>
    </PlanHistoryProvider>
  );
};
