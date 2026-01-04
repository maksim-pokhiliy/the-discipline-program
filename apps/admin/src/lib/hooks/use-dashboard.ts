"use client";

import { useQuery } from "@tanstack/react-query";

import { type DashboardData } from "@repo/contracts/dashboard";
import { adminKeys, STALE_TIMES } from "@repo/query";

import { api } from "../api";

interface UseDashboardDataOptions {
  initialData?: DashboardData;
}

export const useDashboardData = ({ initialData }: UseDashboardDataOptions = {}) => {
  return useQuery({
    queryKey: adminKeys.dashboard(),
    queryFn: api.dashboard.getData,
    initialData,
    staleTime: initialData ? STALE_TIMES.MEDIUM : STALE_TIMES.NONE,
  });
};
