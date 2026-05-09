"use client";

import { useQuery } from "@tanstack/react-query";

import type {
  CreatePlanItemRequest,
  CreatePlanItemResponse,
  GetPlanItemsResponse,
  UpdatePlanItemRequest,
  UpdatePlanItemResponse,
} from "@repo/contracts/lms/plan-item";
import { useOptimisticMutation } from "@repo/query";

import { api } from "../api";
import { platformKeys } from "../api/keys";

type PlanItemScope = {
  planId: string;
  blockId: string;
};

export const useItemsByBlock = (planId: string, blockId: string) =>
  useQuery({
    queryKey: platformKeys.planItems.byBlock(planId, blockId),
    queryFn: () => api.planItems.listByBlock(planId, blockId),
  });

export const useCreatePlanItem = ({ planId, blockId }: PlanItemScope) =>
  useOptimisticMutation<GetPlanItemsResponse, CreatePlanItemRequest, CreatePlanItemResponse>({
    mutationFn: (data) => api.planItems.create(planId, blockId, data),
    queryKey: () => platformKeys.planItems.byBlock(planId, blockId),
    transform: (prev) => prev,
    invalidateKeys: () => [platformKeys.planItems.byBlock(planId, blockId)],
    errorMessage: "Failed to create item",
  });

export const useUpdatePlanItem = ({ planId, blockId }: PlanItemScope) =>
  useOptimisticMutation<
    GetPlanItemsResponse,
    { id: string; data: UpdatePlanItemRequest },
    UpdatePlanItemResponse
  >({
    mutationFn: ({ id, data }) => api.planItems.update(planId, id, data),
    queryKey: () => platformKeys.planItems.byBlock(planId, blockId),
    transform: (prev, { id, data }) => ({
      items: prev.items.map((item) =>
        item.id === id
          ? {
              ...item,
              ...(data.order !== undefined && { order: data.order }),
              ...(data.exerciseId !== undefined && { exerciseId: data.exerciseId }),
              ...(data.prescription !== undefined && { prescription: data.prescription }),
              ...(data.alternatives !== undefined && { alternatives: data.alternatives }),
              ...(data.notes !== undefined && { notes: data.notes }),
            }
          : item,
      ),
    }),
    invalidateKeys: () => [platformKeys.planItems.byBlock(planId, blockId)],
    errorMessage: "Failed to update item",
  });

export const useDeletePlanItem = ({ planId, blockId }: PlanItemScope) =>
  useOptimisticMutation<GetPlanItemsResponse, string, void>({
    mutationFn: (id) => api.planItems.delete(planId, id),
    queryKey: () => platformKeys.planItems.byBlock(planId, blockId),
    transform: (prev, id) => ({ items: prev.items.filter((item) => item.id !== id) }),
    invalidateKeys: () => [platformKeys.planItems.byBlock(planId, blockId)],
    errorMessage: "Failed to delete item",
  });
