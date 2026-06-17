"use client";

import { type ReactElement, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Box, Divider, Stack, Typography } from "@mui/material";

import { type PlanTimetableView } from "@repo/contracts/lms/plan-timetable";

import {
  EMPTY_PLAN_WEEKS_LABEL,
  FIRST_WEEK_LABEL_OFFSET,
  MAIN_MAX_WIDTH_PX,
} from "../utils/plan-timetable.constants";
import {
  aheadHintLabel,
  countWeekProgress,
  formatWeekRangeCompact,
} from "../utils/timetable-presentation";

import { DayRow } from "./day-row";
import { NextWeekHint } from "./next-week-hint";
import { PlanSwitcher } from "./plan-switcher";
import { TimetableProgressRow } from "./timetable-progress-row";
import { WeekDots } from "./week-dots";
import { WeekNavigation } from "./week-navigation";

export type PlanTimetableBoardProps = {
  plans: PlanTimetableView[];
};

const clampWeekIndex = (index: number, weekCount: number): number =>
  Math.min(Math.max(index, 0), Math.max(weekCount - 1, 0));

export const PlanTimetableBoard = ({ plans }: PlanTimetableBoardProps): ReactElement | null => {
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [viewedWeekByPlan, setViewedWeekByPlan] = useState<Record<string, number>>({});
  const todayRowRef = useRef<HTMLDivElement | null>(null);

  const defaultPlan = plans.find((plan) => plan.weeks.length > 0) ?? plans[0];
  const selectedPlan = plans.find((plan) => plan.planId === selectedPlanId) ?? defaultPlan;
  const todayWeekIndex = selectedPlan?.todayWeekIndex ?? null;
  const weekCount = selectedPlan?.weeks.length ?? 0;

  const viewedIndex = clampWeekIndex(
    (selectedPlan ? viewedWeekByPlan[selectedPlan.planId] : undefined) ??
      selectedPlan?.landingWeekIndex ??
      0,
    weekCount,
  );

  const setWeek = useCallback(
    (next: number) => {
      if (selectedPlan === undefined) {
        return;
      }

      setViewedWeekByPlan((prev) => ({
        ...prev,
        [selectedPlan.planId]: clampWeekIndex(next, weekCount),
      }));
    },
    [selectedPlan, weekCount],
  );

  const selectPlanByIndex = useCallback(
    (index: number) => {
      const plan = plans[index];

      if (plan !== undefined) {
        setSelectedPlanId(plan.planId);
      }
    },
    [plans],
  );

  const jumpToToday = useCallback(() => {
    if (todayWeekIndex !== null) {
      setWeek(todayWeekIndex);
    }
  }, [setWeek, todayWeekIndex]);

  const onOpenSession = useCallback((_sessionId: string) => {}, []);

  const isViewingTodayWeek = todayWeekIndex !== null && viewedIndex === todayWeekIndex;

  useEffect(() => {
    if (isViewingTodayWeek && todayRowRef.current) {
      todayRowRef.current.scrollIntoView({ block: "start" });
    }
  }, [selectedPlan, viewedIndex, todayWeekIndex, isViewingTodayWeek]);

  const planSwitcherItems = useMemo(
    () => plans.map((plan) => ({ planId: plan.planId, planTitle: plan.planTitle })),
    [plans],
  );

  if (selectedPlan === undefined) {
    return null;
  }

  const viewedWeek = weekCount > 0 ? selectedPlan.weeks[viewedIndex] : undefined;
  const progress = viewedWeek ? countWeekProgress(viewedWeek) : { done: 0, total: 0 };

  return (
    <Box sx={{ maxWidth: { md: MAIN_MAX_WIDTH_PX }, mx: { md: "auto" } }}>
      <Stack spacing={{ xs: 1.5, md: 2 }}>
        {plans.length > 1 ? (
          <PlanSwitcher
            plans={planSwitcherItems}
            selectedIndex={Math.max(
              0,
              plans.findIndex((plan) => plan.planId === selectedPlan.planId),
            )}
            onSelect={selectPlanByIndex}
          />
        ) : null}

        {viewedWeek === undefined ? (
          <Typography sx={{ py: 4, textAlign: "center", color: "text.secondary" }}>
            {EMPTY_PLAN_WEEKS_LABEL}
          </Typography>
        ) : (
          <>
            <WeekNavigation
              weekLabel={`Week ${viewedWeek.index + FIRST_WEEK_LABEL_OFFSET}`}
              dateRange={formatWeekRangeCompact(viewedWeek.startDate)}
              canPrev={viewedIndex > 0}
              canNext={viewedIndex < weekCount - 1}
              onPrev={() => setWeek(viewedIndex - 1)}
              onNext={() => setWeek(viewedIndex + 1)}
            />

            <WeekDots
              weekCount={weekCount}
              viewedIndex={viewedIndex}
              todayWeekIndex={todayWeekIndex}
            />

            <TimetableProgressRow
              done={progress.done}
              total={progress.total}
              showTodayButton={todayWeekIndex !== null && viewedIndex !== todayWeekIndex}
              onJumpToToday={jumpToToday}
            />

            <Divider />

            <Stack spacing={0}>
              {viewedWeek.days.map((slot) => (
                <DayRow
                  key={slot.dayOfWeek}
                  slot={slot}
                  todayRowRef={todayRowRef}
                  onOpenSession={onOpenSession}
                />
              ))}
            </Stack>

            <NextWeekHint
              label={aheadHintLabel(viewedIndex, weekCount)}
              onNext={() => setWeek(viewedIndex + 1)}
            />
          </>
        )}
      </Stack>
    </Box>
  );
};
