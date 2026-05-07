"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "../api";
import { platformKeys } from "../api/keys";

const LIBRARY_STALE_TIME_MS = 5 * 60 * 1000;

export const useLibraryCatalog = () =>
  useQuery({
    queryKey: platformKeys.library.all(),
    queryFn: () => api.library.getAll(),
    staleTime: LIBRARY_STALE_TIME_MS,
  });
