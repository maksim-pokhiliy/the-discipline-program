"use client";

import { type ReactNode } from "react";

import { QueryWrapper } from "@repo/ui";

import { usePlanTimetable } from "@app/lib/hooks";

import { PlanTimetableBoard, PlanTimetableEmptyState } from "../components";
import { LOADING_LABEL } from "../utils/plan-timetable.constants";

export const PlanTimetableView = (): ReactNode => {
  const { data, isLoading, error } = usePlanTimetable();

  return (
    <QueryWrapper isLoading={isLoading} error={error} data={data} loadingMessage={LOADING_LABEL}>
      {(data) =>
        data.plans.length === 0 ? (
          <PlanTimetableEmptyState />
        ) : (
          <PlanTimetableBoard plans={data.plans} />
        )
      }
    </QueryWrapper>
  );
};
