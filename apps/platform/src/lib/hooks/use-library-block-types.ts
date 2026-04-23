"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "../api";
import { platformKeys } from "../api/keys";

const TEN_MINUTES_MS = 10 * 60 * 1000;

export const useLibraryBlockTypes = () =>
  useQuery({
    queryKey: platformKeys.libraryBlockTypes.all(),
    queryFn: () => api.libraryBlockTypes.list(),
    staleTime: TEN_MINUTES_MS,
  });
