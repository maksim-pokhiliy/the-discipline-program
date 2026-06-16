"use client";

import { useMutation, useQueryClient, type UseMutationResult } from "@tanstack/react-query";

import type { DayOfWeek } from "@repo/contracts/lms/_shared";
import type {
  CreateSessionData,
  ReorderSessionsData,
  Session,
  UpdateSessionData,
} from "@repo/contracts/lms/session";
import { notifyError } from "@repo/query";

import { api } from "../api";
import { platformKeys } from "../api/keys";

import { useWeekMutation } from "./use-week-mutation";

export const useCreateSession = (planId: string, startDate: string, dayOfWeek: DayOfWeek) =>
  useWeekMutation<CreateSessionData, Session>({
    mutationFn: (data) => api.sessions.create(planId, startDate, dayOfWeek, data),
    planId,
    startDate,
    successMessage: "Session created",
    errorMessage: "Failed to create session",
  });

export const useUpdateSession = (planId: string, startDate: string) =>
  useWeekMutation<{ sessionId: string; data: UpdateSessionData }, Session>({
    mutationFn: ({ sessionId, data }) => api.sessions.update(planId, sessionId, data),
    planId,
    startDate,
    successMessage: "Session updated",
    errorMessage: "Failed to update session",
  });

export const useDeleteSession = (planId: string, startDate: string) =>
  useWeekMutation<{ sessionId: string }, void>({
    mutationFn: ({ sessionId }) => api.sessions.delete(planId, sessionId),
    planId,
    startDate,
    successMessage: "Session deleted",
    errorMessage: "Failed to delete session",
  });

export const useReorderSessions = (planId: string, startDate: string, dayOfWeek: DayOfWeek) =>
  useWeekMutation<ReorderSessionsData, { sessions: Session[] }>({
    mutationFn: (data) => api.sessions.reorder(planId, startDate, dayOfWeek, data),
    planId,
    startDate,
    successMessage: "Sessions reordered",
    errorMessage: "Failed to reorder sessions",
  });

export const useDuplicateSession = (
  planId: string,
  startDate: string,
): UseMutationResult<Session, Error, { sessionId: string }> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId }) => api.sessions.duplicate(planId, sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: platformKeys.weeks.byDate(planId, startDate),
      });
    },
    onError: (error: Error) => {
      notifyError(error, "Couldn't duplicate — try again.");
    },
  });
};
