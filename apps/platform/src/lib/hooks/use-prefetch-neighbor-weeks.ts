"use client";

import { useEffect } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { addDays } from "@repo/shared";

import { api } from "../api";
import { platformKeys } from "../api/keys";

const WEEK_LENGTH_DAYS = 6;
const WEEK_STEP_DAYS = 7;

export const usePrefetchNeighborWeeks = (planId: string, weekStart: Date): void => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const prevStart = addDays(weekStart, -WEEK_STEP_DAYS);
    const nextStart = addDays(weekStart, WEEK_STEP_DAYS);

    const prefetch = (start: Date) =>
      queryClient.prefetchQuery({
        queryKey: platformKeys.planDays.byWeek(planId, start),
        queryFn: () =>
          api.planDays.listByPlan(planId, {
            from: start,
            to: addDays(start, WEEK_LENGTH_DAYS),
          }),
      });

    const idle = (cb: () => void) =>
      typeof requestIdleCallback === "function" ? requestIdleCallback(cb) : setTimeout(cb, 0);

    idle(() => {
      void prefetch(prevStart);
      void prefetch(nextStart);
    });
  }, [planId, weekStart, queryClient]);
};
