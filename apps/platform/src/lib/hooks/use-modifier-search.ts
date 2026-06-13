"use client";

import { useQuery } from "@tanstack/react-query";

import type { Modifier } from "@repo/contracts/lms/modifier";

import { api } from "../api";
import { platformKeys } from "../api/keys";

const MODIFIER_SEARCH_STALE_TIME_MS = 30_000;

export const useModifierSearch = (q?: string) =>
  useQuery<Modifier[]>({
    queryKey: platformKeys.modifiers.search(q),
    queryFn: () => api.modifiers.search({ q }),
    staleTime: MODIFIER_SEARCH_STALE_TIME_MS,
  });
