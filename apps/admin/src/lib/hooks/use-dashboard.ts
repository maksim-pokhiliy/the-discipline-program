"use client";

import { useQuery } from "@tanstack/react-query";

import { adminKeys } from "@repo/query";

import { api } from "../api";

export const useDashboardData = () =>
  useQuery({
    queryKey: adminKeys.dashboard(),
    queryFn: api.dashboard.getData,
  });
