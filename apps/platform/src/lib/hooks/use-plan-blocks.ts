"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "../api";
import { platformKeys } from "../api/keys";

export const useBlocksBySession = (planId: string, sessionId: string) =>
  useQuery({
    queryKey: platformKeys.planBlocks.bySession(planId, sessionId),
    queryFn: () => api.planBlocks.listBySession(planId, sessionId),
  });
