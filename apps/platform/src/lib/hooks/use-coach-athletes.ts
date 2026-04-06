"use client";

import { useQuery } from "@tanstack/react-query";

import { platformKeys } from "@repo/query";

import { api } from "../api";

export const useCoachAthletes = () => {
  return useQuery({
    queryKey: platformKeys.athletes.page(),
    queryFn: () => api.coachAthletes.getAthletes(),
  });
};
