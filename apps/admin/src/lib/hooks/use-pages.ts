"use client";

import { useQuery } from "@tanstack/react-query";

import { type AdminPageListItem } from "@repo/contracts/pages";
import { adminKeys, STALE_TIMES } from "@repo/query";

import { api } from "../api";

interface UsePagesListDataOptions {
  initialData?: AdminPageListItem[];
}

export const usePagesListData = ({ initialData }: UsePagesListDataOptions = {}) => {
  return useQuery({
    queryKey: adminKeys.pages.list(),
    queryFn: api.pages.getPages,
    initialData,
    staleTime: initialData ? STALE_TIMES.MEDIUM : STALE_TIMES.NONE,
  });
};
