"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "../api";
import { platformKeys } from "../api/keys";

export const useCoachDashboard = () => {
  return useQuery({
    queryKey: platformKeys.coachDashboard.data(),
    queryFn: () => api.coachDashboard.getDashboard(),
  });
};
