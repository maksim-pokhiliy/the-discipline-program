"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "../api";
import { platformKeys } from "../api/keys";

export const useSearchUsers = (query: string, enabled = true) =>
  useQuery({
    queryKey: platformKeys.users.search(query),
    queryFn: () => api.users.search(query),
    enabled,
  });
