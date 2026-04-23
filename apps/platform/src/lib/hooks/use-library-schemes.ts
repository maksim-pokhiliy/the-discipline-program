"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "../api";
import { platformKeys } from "../api/keys";

const TEN_MINUTES_MS = 10 * 60 * 1000;

export const useLibrarySchemes = () =>
  useQuery({
    queryKey: platformKeys.librarySchemes.all(),
    queryFn: () => api.librarySchemes.list(),
    staleTime: TEN_MINUTES_MS,
  });
