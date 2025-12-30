"use client";

import { DashboardData } from "@repo/api";
import { adminKeys } from "@repo/query";
import { useQuery } from "@tanstack/react-query";

import { api } from "../api";

interface UseDashboardDataOptions {
  initialData?: DashboardData;
}

export const useDashboardData = ({ initialData }: UseDashboardDataOptions = {}) => {
  return useQuery({
    queryKey: adminKeys.dashboard(),
    queryFn: api.dashboard.getData,
    initialData,
    staleTime: 30_000,
  });
};
