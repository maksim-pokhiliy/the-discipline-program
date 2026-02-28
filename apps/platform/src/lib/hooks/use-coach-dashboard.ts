"use client";

import { useQuery } from "@tanstack/react-query";

import { platformKeys } from "@repo/query";

import { api } from "../api";

export const useCoachDashboard = () =>
  useQuery({
    queryKey: platformKeys.coachDashboard.data(),
    queryFn: async () => {
      await api.coachActionItems.reconcile();

      return api.coachDashboard.getDashboard();
    },
  });
