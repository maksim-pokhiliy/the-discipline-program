"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "../api";
import { platformKeys } from "../api/keys";

export const useAthleteSessionView = (sessionId: string) => {
  return useQuery({
    queryKey: platformKeys.athleteSessionView.detail(sessionId),
    queryFn: () => api.athleteSessionView.get(sessionId),
  });
};
