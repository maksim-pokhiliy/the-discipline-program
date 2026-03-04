"use client";

import { useQuery } from "@tanstack/react-query";

import { platformKeys } from "@repo/query";

import { api } from "../api";

export const useCoachDashboard = () => {
  return useQuery({
    queryKey: platformKeys.coachDashboard.data(),
    queryFn: () => api.coachDashboard.getDashboard(),
  });
};
