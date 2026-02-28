"use client";

import { useEffect, useRef } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { platformKeys } from "@repo/query";

import { api } from "../api";

export const useCoachDashboard = () => {
  const queryClient = useQueryClient();
  const reconciled = useRef(false);

  const { mutate } = useMutation({
    mutationFn: () => api.coachActionItems.reconcile(),
    onSuccess: (data) => {
      if (data.created > 0 || data.updated > 0 || data.resolved > 0) {
        queryClient.invalidateQueries({
          queryKey: platformKeys.coachDashboard.data(),
        });
      }
    },
  });

  useEffect(() => {
    if (reconciled.current) {
      return;
    }

    reconciled.current = true;
    mutate();
  }, [mutate]);

  return useQuery({
    queryKey: platformKeys.coachDashboard.data(),
    queryFn: () => api.coachDashboard.getDashboard(),
  });
};
