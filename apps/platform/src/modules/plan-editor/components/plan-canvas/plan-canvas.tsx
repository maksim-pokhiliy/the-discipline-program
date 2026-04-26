"use client";

import { useCallback, useMemo } from "react";

import { DndContext, closestCenter, DragOverlay } from "@dnd-kit/core";
import { Alert, Box, Stack, Typography } from "@mui/material";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { type GetPlanStructureResponse } from "@repo/contracts/lms/training-plan";

import { usePlanStructure } from "@app/lib/hooks";

import { useHistoryKeybindings, usePlanHistory } from "../undo-redo";

import { DayCard } from "./day-card";
import { formatPlanSelection, parsePlanSelection, type PlanSelection } from "./selection";
import { usePlanCanvasDnd } from "./use-plan-canvas-dnd";
import { WeekNavigator } from "./week-navigator";

const DEFAULT_WINDOW = 5;

const computeDefaultRange = (maxIndex: number, current: number) => {
  const half = Math.floor(DEFAULT_WINDOW / 2);
  const fromWeek = Math.max(0, current - half);
  const toWeek = Math.min(maxIndex, fromWeek + DEFAULT_WINDOW - 1);

  return { fromWeek, toWeek };
};

export type PlanCanvasProps = {
  planId: string;
};

const renderWeeks = (
  data: GetPlanStructureResponse,
  selection: PlanSelection | null,
  onSelect: (selection: PlanSelection) => void,
) =>
  data.plan.weeks.map((week) => (
    <Stack key={week.id} spacing={1.5}>
      <Typography variant="overline" color="text.secondary">
        Week {week.index + 1}
        {week.label ? ` — ${week.label}` : ""}
      </Typography>
      <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
        {week.days.map((day) => (
          <DayCard key={day.id} day={day} selection={selection} onSelect={onSelect} />
        ))}
      </Stack>
    </Stack>
  ));

export const PlanCanvas = ({ planId }: PlanCanvasProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const fromParam = searchParams.get("fromWeek");
  const toParam = searchParams.get("toWeek");
  const fromWeek = fromParam !== null ? Number(fromParam) : undefined;
  const toWeek = toParam !== null ? Number(toParam) : undefined;

  const { data, isLoading, error } = usePlanStructure(planId, { fromWeek, toWeek });

  const selection = useMemo(() => parsePlanSelection(searchParams.get("selected")), [searchParams]);

  const handleSelect = useCallback(
    (next: PlanSelection) => {
      const params = new URLSearchParams(searchParams.toString());

      params.set("selected", formatPlanSelection(next));
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const history = usePlanHistory(planId);
  const dnd = usePlanCanvasDnd(planId, data, history);

  useHistoryKeybindings({ history });

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error.message}
      </Alert>
    );
  }

  if (!data) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="body2" color="text.secondary">
          {isLoading ? "Loading plan..." : "No data"}
        </Typography>
      </Box>
    );
  }

  const { window: w } = data;

  const effectiveFrom = fromWeek ?? w.fromWeek;
  const effectiveTo = toWeek ?? w.toWeek;
  const fallback = computeDefaultRange(w.maxIndex, w.toWeek);

  return (
    <DndContext
      sensors={dnd.sensors}
      collisionDetection={closestCenter}
      onDragStart={dnd.onDragStart}
      onDragEnd={dnd.onDragEnd}
    >
      <Stack sx={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
        <WeekNavigator
          fromWeek={effectiveFrom ?? fallback.fromWeek}
          toWeek={effectiveTo ?? fallback.toWeek}
          maxIndex={w.maxIndex}
        />

        <Box
          aria-live="polite"
          aria-atomic="true"
          sx={{ position: "absolute", left: -10000, top: "auto", width: 1, height: 1 }}
        >
          {dnd.announcement}
        </Box>

        <Box sx={{ flex: 1, overflowY: "auto", p: 2 }}>
          <Stack spacing={3}>{renderWeeks(data, selection, handleSelect)}</Stack>
        </Box>
      </Stack>

      <DragOverlay />
    </DndContext>
  );
};
