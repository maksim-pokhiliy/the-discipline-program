"use client";

import { useEffect } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { addDays, DAYS_IN_WEEK, LAST_DAY_OFFSET_IN_WEEK } from "@repo/shared";

import { api } from "../api";
import { platformKeys } from "../api/keys";

export const usePrefetchNeighborWeeks = (planId: string, weekStart: Date): void => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const prevStart = addDays(weekStart, -DAYS_IN_WEEK);
    const nextStart = addDays(weekStart, DAYS_IN_WEEK);

    const prefetch = (start: Date) =>
      queryClient.prefetchQuery({
        queryKey: platformKeys.planDays.byWeek(planId, start),
        queryFn: () =>
          api.planDays.listByPlan(planId, {
            from: start,
            to: addDays(start, LAST_DAY_OFFSET_IN_WEEK),
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
