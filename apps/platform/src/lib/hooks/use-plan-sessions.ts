"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type {
  CreatePlanSessionRequest,
  CreatePlanSessionResponse,
  GetPlanSessionsResponse,
  UpdatePlanSessionRequest,
  UpdatePlanSessionResponse,
} from "@repo/contracts/lms/plan-session";
import { useOptimisticMutation } from "@repo/query";

import { api } from "../api";
import { platformKeys } from "../api/keys";

type PlanSessionScope = {
  planId: string;
  dayId: string;
};

type AddEmptySessionInput = {
  date: Date;
  dayId: string | null;
  order: number;
};

export const useSessionsByDay = (planId: string, dayId: string | null) =>
  useQuery({
    queryKey: platformKeys.planSessions.byDay(planId, dayId ?? ""),
    queryFn: () => api.planSessions.listByDay(planId, dayId ?? ""),
    enabled: dayId !== null,
  });

export const useCreatePlanSession = ({ planId, dayId }: PlanSessionScope) =>
  useOptimisticMutation<
    GetPlanSessionsResponse,
    CreatePlanSessionRequest,
    CreatePlanSessionResponse
  >({
    mutationFn: (data) => api.planSessions.create(planId, dayId, data),
    queryKey: () => platformKeys.planSessions.byDay(planId, dayId),
    transform: (prev) => prev,
    invalidateKeys: () => [platformKeys.planSessions.byDay(planId, dayId)],
    errorMessage: "Failed to create session",
  });

export const useUpdatePlanSession = ({ planId, dayId }: PlanSessionScope) =>
  useOptimisticMutation<
    GetPlanSessionsResponse,
    { id: string; data: UpdatePlanSessionRequest },
    UpdatePlanSessionResponse
  >({
    mutationFn: ({ id, data }) => api.planSessions.update(planId, id, data),
    queryKey: () => platformKeys.planSessions.byDay(planId, dayId),
    transform: (prev, { id, data }) => ({
      sessions: prev.sessions.map((session) =>
        session.id === id
          ? {
              ...session,
              ...(data.order !== undefined && { order: data.order }),
              ...(data.label !== undefined && { label: data.label }),
            }
          : session,
      ),
    }),
    invalidateKeys: () => [platformKeys.planSessions.byDay(planId, dayId)],
    errorMessage: "Failed to update session",
  });

export const useAddEmptySessionToDay = (planId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ date, dayId, order }: AddEmptySessionInput) => {
      const targetDayId = dayId ?? (await api.planDays.upsert(planId, { date })).day.id;

      return api.planSessions.create(planId, targetDayId, { order });
    },
    onSuccess: async (_data, { dayId }) => {
      await queryClient.invalidateQueries({
        queryKey: platformKeys.planDays.byPlan(planId),
      });

      if (dayId !== null) {
        await queryClient.invalidateQueries({
          queryKey: platformKeys.planSessions.byDay(planId, dayId),
        });
      }
    },
  });
};

export const useDeletePlanSession = ({ planId, dayId }: PlanSessionScope) =>
  useOptimisticMutation<GetPlanSessionsResponse, string, void>({
    mutationFn: (id) => api.planSessions.delete(planId, id),
    queryKey: () => platformKeys.planSessions.byDay(planId, dayId),
    transform: (prev, id) => ({
      sessions: prev.sessions.filter((session) => session.id !== id),
    }),
    invalidateKeys: () => [platformKeys.planSessions.byDay(planId, dayId)],
    errorMessage: "Failed to delete session",
  });
