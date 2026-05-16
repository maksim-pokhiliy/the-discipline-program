"use client";

import type { DayOfWeek } from "@repo/contracts/lms/_shared";
import type { DaySlot, UpdateDayLabelData, UpdateDayNotesData } from "@repo/contracts/lms/day";

import { api } from "../api";

import { useWeekMutation } from "./use-week-mutation";

export const useUpdateDayLabel = (planId: string, startDate: string, dayOfWeek: DayOfWeek) =>
  useWeekMutation<UpdateDayLabelData, DaySlot>({
    mutationFn: (data) => api.dayMetadata.setLabel(planId, startDate, dayOfWeek, data),
    planId,
    startDate,
    successMessage: "Day label saved",
    errorMessage: "Failed to save day label",
  });

export const useUpdateDayNotes = (planId: string, startDate: string, dayOfWeek: DayOfWeek) =>
  useWeekMutation<UpdateDayNotesData, DaySlot>({
    mutationFn: (data) => api.dayMetadata.setNotes(planId, startDate, dayOfWeek, data),
    planId,
    startDate,
    successMessage: "Day notes saved",
    errorMessage: "Failed to save day notes",
  });
