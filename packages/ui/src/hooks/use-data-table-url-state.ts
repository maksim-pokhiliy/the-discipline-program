"use client";

import { useCallback } from "react";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { DataTableState } from "../components/data-table/types";

const PARAM_SEARCH = "search";
const PARAM_SORT = "sort";
const PARAM_SORT_DIR = "sortDir";
const PARAM_PAGE = "page";
const PARAM_PER_PAGE = "perPage";
const PARAM_FILTER_PREFIX = "f.";

type UseDataTableUrlStateOptions = {
  defaultSort?: { columnId: string; direction: "asc" | "desc" };
  defaultRowsPerPage?: number;
};

export const useDataTableUrlState = (
  options: UseDataTableUrlStateOptions = {},
): { state: DataTableState; onStateChange: (state: DataTableState) => void } => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = searchParams ?? new URLSearchParams();

  const state: DataTableState = {
    search: params.get(PARAM_SEARCH) ?? "",
    sortColumn: params.get(PARAM_SORT) ?? options.defaultSort?.columnId ?? null,
    sortDirection:
      (params.get(PARAM_SORT_DIR) === "desc" ? "desc" : undefined) ??
      options.defaultSort?.direction ??
      "asc",
    page: Number(params.get(PARAM_PAGE)) || 0,
    rowsPerPage: Number(params.get(PARAM_PER_PAGE)) || options.defaultRowsPerPage || 10,
    filters: Object.fromEntries(
      Array.from(params.entries())
        .filter(([key]) => key.startsWith(PARAM_FILTER_PREFIX))
        .map(([key, value]) => [key.slice(PARAM_FILTER_PREFIX.length), value]),
    ),
  };

  const onStateChange = useCallback(
    (next: DataTableState) => {
      const params = new URLSearchParams();

      if (next.search) {
        params.set(PARAM_SEARCH, next.search);
      }

      if (next.sortColumn && next.sortColumn !== (options.defaultSort?.columnId ?? null)) {
        params.set(PARAM_SORT, next.sortColumn);
      }

      if (next.sortDirection !== (options.defaultSort?.direction ?? "asc")) {
        params.set(PARAM_SORT_DIR, next.sortDirection);
      }

      if (next.page > 0) {
        params.set(PARAM_PAGE, String(next.page));
      }

      if (next.rowsPerPage !== (options.defaultRowsPerPage || 10)) {
        params.set(PARAM_PER_PAGE, String(next.rowsPerPage));
      }

      for (const [key, value] of Object.entries(next.filters)) {
        if (value) {
          params.set(`${PARAM_FILTER_PREFIX}${key}`, value);
        }
      }

      const qs = params.toString();

      router.replace(`${pathname ?? ""}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [router, pathname, options.defaultSort, options.defaultRowsPerPage],
  );

  return { state, onStateChange };
};
