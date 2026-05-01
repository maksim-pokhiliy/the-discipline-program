"use client";

import { useEffect } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import {
  type GetPlanStructureQuery,
  type GetPlanStructureResponse,
} from "@repo/contracts/lms/training-plan";

import { api } from "../api";
import { platformKeys } from "../api/keys";

const STALE_TIME_MS = 30_000;

const PREFETCH_DELAY_MS = 250;

export type UsePlanStructureOptions = {
  fromWeek?: number | undefined;
  toWeek?: number | undefined;
  enabled?: boolean | undefined;
};

const buildQuery = (options: UsePlanStructureOptions): GetPlanStructureQuery | undefined => {
  if (typeof options.fromWeek !== "number" && typeof options.toWeek !== "number") {
    return undefined;
  }

  return { fromWeek: options.fromWeek, toWeek: options.toWeek };
};

export const usePlanStructure = (planId: string, options: UsePlanStructureOptions = {}) => {
  const queryClient = useQueryClient();
  const { fromWeek, toWeek, enabled = true } = options;
  const queryKey = platformKeys.trainingPlans.structure(planId, fromWeek, toWeek);
  const queryArg = buildQuery({ fromWeek, toWeek });

  const result = useQuery<GetPlanStructureResponse>({
    queryKey,
    queryFn: () => api.planStructure.getStructure(planId, queryArg),
    enabled: !!planId && enabled,
    staleTime: STALE_TIME_MS,
  });

  useEffect(() => {
    if (typeof window === "undefined" || !result.data) {
      return;
    }

    const window_ = result.data.window;
    const span = window_.toWeek - window_.fromWeek + 1;
    const prevTo = Math.max(0, window_.fromWeek - 1);
    const prevFrom = Math.max(0, prevTo - span + 1);
    const nextFrom = Math.min(window_.maxIndex, window_.toWeek + 1);
    const nextTo = Math.min(window_.maxIndex, nextFrom + span - 1);

    const prefetch = (rangeFrom: number, rangeTo: number) => {
      if (rangeFrom > rangeTo) {
        return;
      }

      void queryClient.prefetchQuery({
        queryKey: platformKeys.trainingPlans.structure(planId, rangeFrom, rangeTo),
        queryFn: () =>
          api.planStructure.getStructure(planId, { fromWeek: rangeFrom, toWeek: rangeTo }),
        staleTime: STALE_TIME_MS,
      });
    };

    const id = window.setTimeout(() => {
      if (prevTo < window_.fromWeek) {
        prefetch(prevFrom, prevTo);
      }

      if (nextFrom > window_.toWeek) {
        prefetch(nextFrom, nextTo);
      }
    }, PREFETCH_DELAY_MS);

    return () => window.clearTimeout(id);
  }, [planId, queryClient, result.data]);

  return result;
};
