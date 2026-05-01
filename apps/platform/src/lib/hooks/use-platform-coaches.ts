"use client";

import { useQuery } from "@tanstack/react-query";

import { STALE_TIMES } from "@repo/query";

import { api } from "../api";
import { platformKeys } from "../api/keys";

export const usePlatformCoaches = (enabled = true) =>
  useQuery({
    queryKey: platformKeys.platformCoaches.all(),
    queryFn: () => api.platformCoaches.list(),
    enabled,
    staleTime: STALE_TIMES.FIVE_MINUTES,
  });
