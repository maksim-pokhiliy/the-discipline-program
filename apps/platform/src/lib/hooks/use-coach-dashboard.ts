"use client";

import { useQuery } from "@tanstack/react-query";

import type { CoachDashboardData } from "@repo/contracts/coach-dashboard";
import { platformKeys, STALE_TIMES } from "@repo/query";

import { api } from "../api";

export const useCoachDashboard = (initialData?: CoachDashboardData) =>
  useQuery({
    queryKey: platformKeys.coachDashboard.data(),
    queryFn: api.coachDashboard.getDashboard,
    initialData,
    staleTime: initialData ? STALE_TIMES.SHORT : STALE_TIMES.NONE,
  });
