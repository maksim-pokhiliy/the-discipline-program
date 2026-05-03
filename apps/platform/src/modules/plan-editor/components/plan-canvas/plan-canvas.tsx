"use client";

import { useCallback } from "react";

import { Alert, Box, Stack, Typography } from "@mui/material";
import { useSearchParams } from "next/navigation";

import { type GetPlanStructureResponse } from "@repo/contracts/lms/training-plan";

import { usePlanStructure } from "@app/lib/hooks";

import { useEditingTarget } from "../../lib/editing-target";

import { EffectivePlanDecorationProvider } from "./effective-plan-decoration-context";
import { PlanCanvasEmptyState } from "./plan-canvas-empty-state";
import { type PlanSelection, type PlanSelectionKind } from "./selection";
import { usePlanCanvasSelection } from "./use-plan-canvas-selection";
import { WeekNavigator } from "./week-navigator";
import { WeekRow } from "./week-row";

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

export type PlanCanvasSelectArgs = {
  kind: PlanSelectionKind;
  id: string;
  additive: boolean;
};

const renderWeeks = (
  data: GetPlanStructureResponse,
  planId: string,
  selection: PlanSelection | null,
  onSelect: (args: PlanCanvasSelectArgs) => void,
) =>
  data.plan.weeks.map((week) => (
    <WeekRow key={week.id} week={week} planId={planId} selection={selection} onSelect={onSelect} />
  ));

export const PlanCanvas = ({ planId }: PlanCanvasProps) => {
  const searchParams = useSearchParams();

  const fromParam = searchParams.get("fromWeek");
  const toParam = searchParams.get("toWeek");
  const fromWeek = fromParam !== null ? Number(fromParam) : undefined;
  const toWeek = toParam !== null ? Number(toParam) : undefined;

  const { data, isLoading, error } = usePlanStructure(planId, { fromWeek, toWeek });

  const { target } = useEditingTarget();
  const decorationEnrollmentId = target.kind === "athlete" ? target.enrollmentId : null;

  const { selection, toggleSelection } = usePlanCanvasSelection();

  const handleSelect = useCallback(
    ({ kind, id, additive }: PlanCanvasSelectArgs) => {
      toggleSelection(kind, id, additive);
    },
    [toggleSelection],
  );

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

  if (data.plan.weeks.length === 0) {
    return <PlanCanvasEmptyState />;
  }

  const { window: w } = data;

  const effectiveFrom = fromWeek ?? w.fromWeek;
  const effectiveTo = toWeek ?? w.toWeek;
  const fallback = computeDefaultRange(w.maxIndex, w.toWeek);
  const decorationFrom = effectiveFrom ?? fallback.fromWeek;
  const decorationTo = effectiveTo ?? fallback.toWeek;

  return (
    <EffectivePlanDecorationProvider
      enrollmentId={decorationEnrollmentId}
      fromWeek={decorationFrom}
      toWeek={decorationTo}
    >
      <Stack sx={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
        <WeekNavigator fromWeek={decorationFrom} toWeek={decorationTo} maxIndex={w.maxIndex} />

        <Box sx={{ flex: 1, overflowY: "auto", p: 2 }}>
          <Stack spacing={3}>{renderWeeks(data, planId, selection, handleSelect)}</Stack>
        </Box>
      </Stack>
    </EffectivePlanDecorationProvider>
  );
};
