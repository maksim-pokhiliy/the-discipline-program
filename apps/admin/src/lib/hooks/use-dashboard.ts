"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "../api";

export const useDashboardData = () =>
  useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: api.dashboard.getData,
  });
