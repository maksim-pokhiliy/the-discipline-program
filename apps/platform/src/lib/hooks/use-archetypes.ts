"use client";

import { useQuery } from "@tanstack/react-query";

import type { Archetype } from "@repo/contracts/lms/archetype";

import { api } from "../api";
import { platformKeys } from "../api/keys";

export const useArchetypes = () =>
  useQuery<Archetype[]>({
    queryKey: platformKeys.archetypes.all(),
    queryFn: () => api.archetypes.list(),
    staleTime: Infinity,
  });
