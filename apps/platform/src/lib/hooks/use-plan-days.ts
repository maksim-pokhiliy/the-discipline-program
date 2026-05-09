"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import type {
  CreatePlanDayRequest,
  CreatePlanDayResponse,
  GetPlanDaysResponse,
  UpdatePlanDayRequest,
  UpdatePlanDayResponse,
} from "@repo/contracts/lms/plan-day";
import { useOptimisticMutation } from "@repo/query";
import { addDays, LAST_DAY_OFFSET_IN_WEEK } from "@repo/shared";

import { api } from "../api";
import { platformKeys } from "../api/keys";

type PlanDayScope = {
  planId: string;
};

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

export const useUpsertPlanDay = ({ planId }: PlanDayScope) =>
  useOptimisticMutation<GetPlanDaysResponse, CreatePlanDayRequest, CreatePlanDayResponse>({
    mutationFn: (data) => api.planDays.upsert(planId, data),
    queryKey: () => platformKeys.planDays.byPlan(planId),
    transform: (prev) => prev,
    invalidateKeys: () => [platformKeys.planDays.byPlan(planId)],
    errorMessage: "Failed to save day",
  });

export const useUpdatePlanDay = ({ planId }: PlanDayScope) =>
  useOptimisticMutation<
    GetPlanDaysResponse,
    { id: string; data: UpdatePlanDayRequest },
    UpdatePlanDayResponse
  >({
    mutationFn: ({ id, data }) => api.planDays.update(planId, id, data),
    queryKey: () => platformKeys.planDays.byPlan(planId),
    transform: (prev) => prev,
    invalidateKeys: () => [platformKeys.planDays.byPlan(planId)],
    errorMessage: "Failed to update day",
  });

export const useDeletePlanDay = ({ planId }: PlanDayScope) =>
  useOptimisticMutation<GetPlanDaysResponse, string, void>({
    mutationFn: (id) => api.planDays.delete(planId, id),
    queryKey: () => platformKeys.planDays.byPlan(planId),
    transform: (prev) => prev,
    invalidateKeys: () => [platformKeys.planDays.byPlan(planId)],
    errorMessage: "Failed to delete day",
  });
