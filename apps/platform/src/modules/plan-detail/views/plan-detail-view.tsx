"use client";

import { useCallback, useMemo } from "react";

import { Stack } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { ForbiddenError, NotFoundError } from "@repo/errors";
import { addDays, formatDateParam } from "@repo/shared";
import { QueryWrapper } from "@repo/ui";

import { api } from "@app/lib/api";
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
  buildBlockTypeMap,
  buildDayTypeMap,
  buildExerciseMap,
  buildSchemeTypeMap,
  groupDaysByDate,
} from "../lib";
import { PlanDetailHeaderSection, WeekChromeSection, WeekGridSection } from "../sections";

const WEEK_LENGTH_DAYS = 6;
const WEEK_STEP_DAYS = 7;

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

type PlanDetailViewProps = { planId: string };

export const PlanDetailView: React.FC<PlanDetailViewProps> = ({ planId }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const weekStart = useWeekStart();

  const planQuery = useTrainingPlan(planId);
  const libraryQuery = useLibraryCatalog();
  const daysQuery = usePlanDaysWeek(planId, weekStart);

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
  const data =
    planQuery.data && libraryQuery.data && daysQuery.data ? { plan: planQuery.data } : undefined;

  const handleWeekChange = useCallback(
    (next: Date): void => {
      router.push(`?week=${formatDateParam(next)}`);
    },
    [router],
  );

  const handleArrowHover = useCallback(
    (direction: "prev" | "next"): void => {
      const offset = direction === "prev" ? -WEEK_STEP_DAYS : WEEK_STEP_DAYS;
      const target = addDays(weekStart, offset);

      void queryClient.prefetchQuery({
        queryKey: platformKeys.planDays.byWeek(planId, target),
        queryFn: () =>
          api.planDays.listByPlan(planId, {
            from: target,
            to: addDays(target, WEEK_LENGTH_DAYS),
          }),
      });
    },
    [queryClient, planId, weekStart],
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
        {({ plan }) => (
          <Stack spacing={3}>
            <PlanDetailHeaderSection plan={plan} />
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
            />
          </Stack>
        )}
      </QueryWrapper>
    </Stack>
  );
};
