"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "../api";
import { platformKeys } from "../api/keys";

export const useCoachAthleteProfile = (athleteId: string | null) => {
  return useQuery({
    queryKey: platformKeys.coachAthleteProfile.byId(athleteId ?? ""),
    queryFn: () => api.coachAthleteProfile.get(athleteId ?? ""),
    enabled: !!athleteId,
  });
};
