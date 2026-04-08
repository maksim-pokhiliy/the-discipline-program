"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "../api";
import { platformKeys } from "../api/keys";

export const useCoachAthletes = () =>
  useQuery({
    queryKey: platformKeys.athletes.page(),
    queryFn: () => api.coachAthletes.getAthletes(),
  });

export const useCoachAthleteDetail = (userId: string | null) =>
  useQuery({
    queryKey: platformKeys.athletes.byId(userId ?? ""),
    queryFn: () => api.coachAthletes.getAthleteDetail(userId ?? ""),
    enabled: !!userId,
  });
