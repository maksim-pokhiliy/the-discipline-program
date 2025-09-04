"use client";

import { useQuery } from "@tanstack/react-query";

import { adminApi } from "../api";

export const useDashboardData = () =>
  useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: adminApi.dashboard.getData,
  });
