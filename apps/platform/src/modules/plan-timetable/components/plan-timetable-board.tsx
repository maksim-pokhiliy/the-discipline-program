"use client";

import { type ReactElement, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Timeline } from "@mui/lab";
import { Box, Divider, Stack, Typography } from "@mui/material";

import { type PlanTimetableView } from "@repo/contracts/lms/plan-timetable";
import { LAYOUT } from "@repo/shared";

import {
  DOTS_MAX_COUNT,
  EMPTY_PLAN_WEEKS_LABEL,
  FIRST_WEEK_LABEL_OFFSET,
  FONT_WEIGHT_SEMI_BOLD,
  PLAN_RAIL_PAD_X,
  PLAN_RAIL_WIDTH_PX,
  RAIL_EYEBROW_PX,
  RAIL_PAD_Y,
  WEEKDAY_LETTER_SPACING,
} from "../utils/plan-timetable.constants";
import {
  aheadHintLabel,
  buildPlanRailItems,
  buildWeeksNavItems,
  countWeekProgress,
  formatWeekRangeCompact,
} from "../utils/timetable-presentation";

import { DayRow } from "./day-row";
import { NextWeekHint } from "./next-week-hint";
import { PlanRail } from "./plan-rail";
import { PlanSwitcher } from "./plan-switcher";
import { PlanWeeksNav } from "./plan-weeks-nav";
import { TimetableProgressRow } from "./timetable-progress-row";
import { WeekCountIndicator } from "./week-count-indicator";
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
  const todayRowRef = useRef<HTMLLIElement | null>(null);

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

  const selectPlanById = useCallback((planId: string) => {
    setSelectedPlanId(planId);
  }, []);

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

  const planRailItems = useMemo(
    () => (selectedPlan ? buildPlanRailItems(plans, viewedWeekByPlan, selectedPlan.planId) : []),
    [plans, viewedWeekByPlan, selectedPlan],
  );

  const weeksNavItems = useMemo(
    () => (selectedPlan ? buildWeeksNavItems(selectedPlan, viewedIndex) : []),
    [selectedPlan, viewedIndex],
  );

  if (selectedPlan === undefined) {
    return null;
  }

  const viewedWeek = weekCount > 0 ? selectedPlan.weeks[viewedIndex] : undefined;
  const progress = viewedWeek ? countWeekProgress(viewedWeek) : { done: 0, total: 0 };
  const showChips = plans.length > 1;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        height: "100%",
        width: "100%",
      }}
    >
      <Box
        sx={(theme) => ({
          display: { xs: "none", md: "block" },
          width: PLAN_RAIL_WIDTH_PX,
          flexShrink: 0,
          height: "100%",
          overflowY: "auto",
          borderRight: `1px solid ${theme.palette.divider}`,
        })}
      >
        <PlanRail items={planRailItems} onSelect={selectPlanById} />
      </Box>

      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          overflowY: "auto",
          px: PLAN_RAIL_PAD_X,
          pt: RAIL_PAD_Y,
          pb: { xs: `${LAYOUT.platformBottomNavHeight + 16}px`, md: RAIL_PAD_Y },
        }}
      >
        <Stack spacing={{ xs: 1.5, md: 2 }}>
          <Typography
            component="span"
            sx={(theme) => ({
              display: { xs: "none", md: "block" },
              fontSize: theme.typography.pxToRem(RAIL_EYEBROW_PX),
              fontWeight: FONT_WEIGHT_SEMI_BOLD,
              letterSpacing: WEEKDAY_LETTER_SPACING,
              textTransform: "uppercase",
              color: theme.palette.text.secondary,
            })}
          >
            {selectedPlan.planTitle}
          </Typography>

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

              {showChips ? (
                <Box sx={{ display: { xs: "block", md: "none" } }}>
                  <PlanSwitcher
                    plans={planSwitcherItems}
                    selectedIndex={Math.max(
                      0,
                      plans.findIndex((plan) => plan.planId === selectedPlan.planId),
                    )}
                    onSelect={selectPlanByIndex}
                  />
                </Box>
              ) : null}

              {weekCount <= DOTS_MAX_COUNT ? (
                <WeekDots
                  weekCount={weekCount}
                  viewedIndex={viewedIndex}
                  todayWeekIndex={todayWeekIndex}
                />
              ) : (
                <WeekCountIndicator
                  label={`Week ${viewedIndex + FIRST_WEEK_LABEL_OFFSET} of ${weekCount}`}
                />
              )}

              <TimetableProgressRow
                done={progress.done}
                total={progress.total}
                showTodayButton={todayWeekIndex !== null && viewedIndex !== todayWeekIndex}
                onJumpToToday={jumpToToday}
              />

              <Divider />

              <Timeline position="right" sx={{ p: 0, m: 0 }}>
                {viewedWeek.days.map((slot) => (
                  <DayRow
                    key={slot.dayOfWeek}
                    slot={slot}
                    todayRowRef={todayRowRef}
                    onOpenSession={onOpenSession}
                  />
                ))}
                <NextWeekHint
                  label={aheadHintLabel(viewedIndex, weekCount)}
                  onNext={() => setWeek(viewedIndex + 1)}
                />
              </Timeline>
            </>
          )}
        </Stack>
      </Box>

      <Box
        sx={(theme) => ({
          display: { xs: "none", md: "block" },
          width: PLAN_RAIL_WIDTH_PX,
          flexShrink: 0,
          height: "100%",
          overflowY: "auto",
          borderLeft: `1px solid ${theme.palette.divider}`,
        })}
      >
        {viewedWeek !== undefined ? (
          <PlanWeeksNav items={weeksNavItems} onSelectWeek={setWeek} />
        ) : null}
      </Box>
    </Box>
  );
};
