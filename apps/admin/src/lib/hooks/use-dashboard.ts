"use client";

import { adminKeys } from "@repo/query";
import { useQuery } from "@tanstack/react-query";

import { api } from "../api";

export const useDashboardData = () =>
  useQuery({
    queryKey: adminKeys.dashboard(),
    queryFn: api.dashboard.getData,
  });
