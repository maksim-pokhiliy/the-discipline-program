"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { addDays } from "@repo/shared";

import { api } from "../api";
import { platformKeys } from "../api/keys";

const WEEK_LENGTH_DAYS = 6;

export const usePlanDaysWeek = (planId: string, weekStart: Date) =>
  useQuery({
    queryKey: platformKeys.planDays.byWeek(planId, weekStart),
    queryFn: () =>
      api.planDays.listByPlan(planId, {
        from: weekStart,
        to: addDays(weekStart, WEEK_LENGTH_DAYS),
      }),
    placeholderData: keepPreviousData,
  });
