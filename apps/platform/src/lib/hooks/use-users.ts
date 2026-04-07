"use client";

import { useQuery } from "@tanstack/react-query";

import { platformKeys } from "@repo/query";

import { api } from "../api";

export const useSearchUsers = (query: string, enabled = true) =>
  useQuery({
    queryKey: platformKeys.users.search(query),
    queryFn: () => api.users.search(query),
    enabled,
  });
