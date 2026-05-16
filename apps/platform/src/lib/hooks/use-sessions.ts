"use client";

import type { DayOfWeek } from "@repo/contracts/lms/_shared";
import type {
  CreateSessionData,
  ReorderSessionsData,
  Session,
  UpdateSessionData,
} from "@repo/contracts/lms/session";

import { api } from "../api";

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
