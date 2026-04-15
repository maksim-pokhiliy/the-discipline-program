"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "../api";
import { adminKeys } from "../api/keys";

export const useDashboardData = () =>
  useQuery({
    queryKey: adminKeys.dashboard(),
    queryFn: api.dashboard.getData,
  });
