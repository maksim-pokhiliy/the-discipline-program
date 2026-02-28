"use client";

import { useEffect, useRef } from "react";

import { useMutation, useQuery } from "@tanstack/react-query";

import { platformKeys } from "@repo/query";

import { api } from "../api";

export const useCoachDashboard = () => {
  const reconciled = useRef(false);

  const reconcile = useMutation({
    mutationFn: () => api.coachActionItems.reconcile(),
  });

  const { mutate } = reconcile;

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
    enabled: reconcile.isSuccess || reconcile.isError,
  });
};
