"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "../api";
import { platformKeys } from "../api/keys";

export const useSessionsByDay = (planId: string, dayId: string | null) =>
  useQuery({
    queryKey: platformKeys.planSessions.byDay(planId, dayId ?? ""),
    queryFn: () => api.planSessions.listByDay(planId, dayId ?? ""),
    enabled: dayId !== null,
  });
