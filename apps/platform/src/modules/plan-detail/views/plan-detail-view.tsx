"use client";

import { useCallback, useMemo } from "react";

import { Stack } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { type PlanDay } from "@repo/contracts/lms/plan-day";
import { type TrainingPlan } from "@repo/contracts/lms/training-plan";
import { ForbiddenError, NotFoundError } from "@repo/errors";
import { addDays, DAYS_IN_WEEK, formatDateParam, LAST_DAY_OFFSET_IN_WEEK } from "@repo/shared";
import { QueryWrapper } from "@repo/ui";

import { api } from "@app/lib/api";
import { type LibraryCatalog } from "@app/lib/api/endpoints";
import { platformKeys } from "@app/lib/api/keys";
import {
  useLibraryCatalog,
  usePlanDaysWeek,
  usePrefetchNeighborWeeks,
  useTrainingPlan,
  useWeekStart,
} from "@app/lib/hooks";

import { type Lookups } from "../components";
import {
  BlockPanelContainer,
  DayPanelContainer,
  SessionPanelContainer,
} from "../components/edit-panel";
import {
  buildBlockTypeMap,
  buildDayTypeMap,
  buildExerciseMap,
  buildSchemeTypeMap,
  groupDaysByDate,
  useEditPanelState,
} from "../lib";
import { PlanDetailHeaderSection, WeekChromeSection, WeekGridSection } from "../sections";

const FORBIDDEN_MESSAGE = "You don't have access to this plan";
const NOT_FOUND_MESSAGE = "Plan not found";
const GENERIC_ERROR_MESSAGE = "Failed to load plan";

const narrowErrorMessage = (error: Error | null): string => {
  if (error instanceof ForbiddenError) {
    return FORBIDDEN_MESSAGE;
  }

  if (error instanceof NotFoundError) {
    return NOT_FOUND_MESSAGE;
  }

  return GENERIC_ERROR_MESSAGE;
};

type PlanDetailData = {
  plan: TrainingPlan;
  library: LibraryCatalog;
  days: PlanDay[];
};

type PlanDetailViewProps = { planId: string };

export const PlanDetailView: React.FC<PlanDetailViewProps> = ({ planId }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const weekStart = useWeekStart();

  const planQuery = useTrainingPlan(planId);
  const libraryQuery = useLibraryCatalog();
  const daysQuery = usePlanDaysWeek(planId, weekStart);
  const editPanel = useEditPanelState();

  usePrefetchNeighborWeeks(planId, weekStart);

  const lookups = useMemo<Lookups>(
    () => ({
      exercises: buildExerciseMap(libraryQuery.data?.exercises ?? []),
      blockTypes: buildBlockTypeMap(libraryQuery.data?.blockTypes ?? []),
      schemeTypes: buildSchemeTypeMap(libraryQuery.data?.schemeTypes ?? []),
    }),
    [libraryQuery.data],
  );

  const dayTypeMap = useMemo(
    () => buildDayTypeMap(libraryQuery.data?.dayTypes ?? []),
    [libraryQuery.data],
  );

  const dayBuckets = useMemo(
    () => groupDaysByDate(daysQuery.data?.days ?? [], dayTypeMap),
    [daysQuery.data, dayTypeMap],
  );

  const isLoading = planQuery.isLoading || libraryQuery.isLoading || daysQuery.isLoading;
  const error = planQuery.error ?? libraryQuery.error ?? daysQuery.error;
  const data: PlanDetailData | undefined =
    planQuery.data && libraryQuery.data && daysQuery.data
      ? { plan: planQuery.data, library: libraryQuery.data, days: daysQuery.data.days }
      : undefined;

  const handleWeekChange = useCallback(
    (next: Date): void => {
      router.push(`?week=${formatDateParam(next)}`);
    },
    [router],
  );

  const handleArrowHover = useCallback(
    (direction: "prev" | "next"): void => {
      const offset = direction === "prev" ? -DAYS_IN_WEEK : DAYS_IN_WEEK;
      const target = addDays(weekStart, offset);

      void queryClient.prefetchQuery({
        queryKey: platformKeys.planDays.byWeek(planId, target),
        queryFn: () =>
          api.planDays.listByPlan(planId, {
            from: target,
            to: addDays(target, LAST_DAY_OFFSET_IN_WEEK),
          }),
      });
    },
    [queryClient, planId, weekStart],
  );

  const handleEditDay = useCallback(
    (date: Date, dayId: string | null): void => {
      editPanel.openPanel({ kind: "day", dayId, date });
    },
    [editPanel],
  );

  const handleEditSession = useCallback(
    (dayId: string, sessionId: string): void => {
      editPanel.openPanel({ kind: "session", dayId, sessionId });
    },
    [editPanel],
  );

  const handleAddBlock = useCallback(
    (sessionId: string): void => {
      editPanel.openPanel({ kind: "block", sessionId, blockId: null });
    },
    [editPanel],
  );

  const handleEditBlock = useCallback(
    (sessionId: string, blockId: string): void => {
      editPanel.openPanel({ kind: "block", sessionId, blockId });
    },
    [editPanel],
  );

  return (
    <Stack spacing={4}>
      <QueryWrapper
        isLoading={isLoading}
        error={error}
        data={data}
        loadingMessage="Loading plan..."
        errorMessage={narrowErrorMessage(error)}
      >
        {({ plan, library, days }) => (
          <Stack spacing={3}>
            <PlanDetailHeaderSection
              plan={plan}
              saveStatus={editPanel.saveStatus}
              onRetry={editPanel.retryLast}
              {...(editPanel.lastError !== null
                ? { errorMessage: editPanel.lastError.message }
                : {})}
            />
            <WeekChromeSection
              weekStart={weekStart}
              onWeekChange={handleWeekChange}
              onArrowHover={handleArrowHover}
            />
            <WeekGridSection
              planId={planId}
              weekStart={weekStart}
              dayBuckets={dayBuckets}
              lookups={lookups}
              onEditDay={handleEditDay}
              onEditSession={handleEditSession}
              onAddBlock={handleAddBlock}
              onEditBlock={handleEditBlock}
            />
            {editPanel.open?.kind === "day" && (
              <DayPanelContainer
                planId={planId}
                panel={editPanel.open}
                days={days}
                dayTypes={library.dayTypes}
                onClose={editPanel.requestClose}
                onStatusChange={editPanel.setSaveStatus}
              />
            )}
            {editPanel.open?.kind === "session" && (
              <SessionPanelContainer
                planId={planId}
                panel={editPanel.open}
                onClose={editPanel.requestClose}
                onStatusChange={editPanel.setSaveStatus}
              />
            )}
            {editPanel.open?.kind === "block" && (
              <BlockPanelContainer
                planId={planId}
                panel={editPanel.open}
                lookups={lookups}
                onClose={editPanel.requestClose}
                onStatusChange={editPanel.setSaveStatus}
              />
            )}
          </Stack>
        )}
      </QueryWrapper>
    </Stack>
  );
};
