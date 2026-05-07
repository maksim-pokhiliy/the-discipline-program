"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { addDays, LAST_DAY_OFFSET_IN_WEEK } from "@repo/shared";

import { api } from "../api";
import { platformKeys } from "../api/keys";

export const usePlanDaysWeek = (planId: string, weekStart: Date) =>
  useQuery({
    queryKey: platformKeys.planDays.byWeek(planId, weekStart),
    queryFn: () =>
      api.planDays.listByPlan(planId, {
        from: weekStart,
        to: addDays(weekStart, LAST_DAY_OFFSET_IN_WEEK),
      }),
    placeholderData: keepPreviousData,
  });
