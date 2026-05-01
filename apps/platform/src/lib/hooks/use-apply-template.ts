"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  type ApplyBlockTemplateInput,
  type ApplySessionTemplateInput,
  type ApplyTemplateResponse,
  type ApplyWeekTemplateInput,
} from "@repo/contracts/lms/training-plan";
import { notifyError } from "@repo/query";

import { api } from "../api";
import { platformKeys } from "../api/keys";

type BlockApplyVars = Omit<ApplyBlockTemplateInput, "kind">;
type SessionApplyVars = Omit<ApplySessionTemplateInput, "kind">;
type WeekApplyVars = Omit<ApplyWeekTemplateInput, "kind">;

const invalidatePlanStructure = (
  queryClient: ReturnType<typeof useQueryClient>,
  planId: string,
) => {
  queryClient.invalidateQueries({ queryKey: platformKeys.trainingPlans.structureByPlan(planId) });
};

export const useApplyBlockTemplate = (planId: string) => {
  const queryClient = useQueryClient();

  return useMutation<ApplyTemplateResponse, Error, BlockApplyVars>({
    mutationFn: (vars) => api.trainingPlans.applyTemplate(planId, { kind: "block", ...vars }),
    onSuccess: () => {
      toast.success("Block template applied");
      invalidatePlanStructure(queryClient, planId);
    },
    onError: (error) => {
      notifyError(error, "Failed to apply block template");
    },
  });
};

export const useApplySessionTemplate = (planId: string) => {
  const queryClient = useQueryClient();

  return useMutation<ApplyTemplateResponse, Error, SessionApplyVars>({
    mutationFn: (vars) => api.trainingPlans.applyTemplate(planId, { kind: "session", ...vars }),
    onSuccess: () => {
      toast.success("Session template applied");
      invalidatePlanStructure(queryClient, planId);
    },
    onError: (error) => {
      notifyError(error, "Failed to apply session template");
    },
  });
};

export const useApplyWeekTemplate = (planId: string) => {
  const queryClient = useQueryClient();

  return useMutation<ApplyTemplateResponse, Error, WeekApplyVars>({
    mutationFn: (vars) => api.trainingPlans.applyTemplate(planId, { kind: "week", ...vars }),
    onSuccess: () => {
      toast.success("Week template applied");
      invalidatePlanStructure(queryClient, planId);
    },
    onError: (error) => {
      notifyError(error, "Failed to apply week template");
    },
  });
};
