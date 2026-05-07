"use client";

import { useMemo } from "react";

import { useSearchParams } from "next/navigation";

import { getMonday, parseDateParam } from "@repo/shared";

export const useWeekStart = (): Date => {
  const searchParams = useSearchParams();
  const weekParam = searchParams.get("week");

  return useMemo(() => {
    if (!weekParam) {
      return getMonday(new Date());
    }

    const parsed = parseDateParam(weekParam);

    if (parsed === null) {
      return getMonday(new Date());
    }

    return getMonday(parsed);
  }, [weekParam]);
};
