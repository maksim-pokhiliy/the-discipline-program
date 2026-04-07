"use client";

import { useMemo } from "react";

import { useSearchParams } from "next/navigation";

import { getMonday, parseDateParam } from "@app/modules/plan-detail/components/week-helpers";

export const useWeekStart = (): Date => {
  const searchParams = useSearchParams();
  const weekParam = searchParams.get("week");

  return useMemo(
    () => (weekParam ? getMonday(parseDateParam(weekParam)) : getMonday(new Date())),
    [weekParam],
  );
};
