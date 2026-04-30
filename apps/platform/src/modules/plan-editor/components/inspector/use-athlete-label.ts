"use client";

import { useMemo } from "react";

import { usePlanEnrollments } from "@app/lib/hooks";

export const useAthleteLabel = (planId: string, enrollmentId: string): string | null => {
  const enrollmentsQuery = usePlanEnrollments(planId);

  return useMemo(() => {
    const entry = enrollmentsQuery.data?.find((e) => e.id === enrollmentId);

    if (!entry) {
      return null;
    }

    return entry.user.name?.trim() || entry.user.email.trim() || entry.user.id;
  }, [enrollmentId, enrollmentsQuery.data]);
};
