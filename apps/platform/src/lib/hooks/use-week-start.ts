"use client";

import { useMemo } from "react";

import { useSearchParams } from "next/navigation";

import { getMonday, parseDateParam } from "@app/lib/utils/date-utils";

export const useWeekStart = (): Date => {
  const searchParams = useSearchParams();
  const weekParam = searchParams.get("week");

  return useMemo(
    () => (weekParam ? getMonday(parseDateParam(weekParam)) : getMonday(new Date())),
    [weekParam],
  );
};
