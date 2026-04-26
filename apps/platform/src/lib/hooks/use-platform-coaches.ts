"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "../api";
import { platformKeys } from "../api/keys";

export const usePlatformCoaches = (enabled = true) =>
  useQuery({
    queryKey: platformKeys.platformCoaches.all(),
    queryFn: () => api.platformCoaches.list(),
    enabled,
    staleTime: 5 * 60_000,
  });
