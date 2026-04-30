"use client";

import { useCallback, useMemo } from "react";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  formatPlanSelection,
  parsePlanSelection,
  type PlanSelection,
  type PlanSelectionKind,
  togglePlanSelectionId,
} from "./selection";

export type UsePlanCanvasSelectionApi = {
  selection: PlanSelection | null;
  isSelected: (kind: PlanSelectionKind, id: string) => boolean;
  toggleSelection: (kind: PlanSelectionKind, id: string, additive: boolean) => void;
  replaceSelection: (next: PlanSelection | null) => void;
  clearSelection: () => void;
};

export const usePlanCanvasSelection = (): UsePlanCanvasSelectionApi => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selection = useMemo(() => parsePlanSelection(searchParams.get("selected")), [searchParams]);

  const writeUrl = useCallback(
    (next: PlanSelection | null) => {
      const params = new URLSearchParams(searchParams.toString());

      if (!next) {
        params.delete("selected");
      } else {
        const formatted = formatPlanSelection(next);

        if (formatted) {
          params.set("selected", formatted);
        } else {
          params.delete("selected");
        }
      }

      const query = params.toString();

      router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const isSelected = useCallback(
    (kind: PlanSelectionKind, id: string) => {
      if (!selection) {
        return false;
      }

      return selection.kind === kind && selection.ids.includes(id);
    },
    [selection],
  );

  const toggleSelection = useCallback(
    (kind: PlanSelectionKind, id: string, additive: boolean) => {
      writeUrl(togglePlanSelectionId(selection, kind, id, additive));
    },
    [selection, writeUrl],
  );

  const replaceSelection = useCallback(
    (next: PlanSelection | null) => {
      writeUrl(next);
    },
    [writeUrl],
  );

  const clearSelection = useCallback(() => {
    writeUrl(null);
  }, [writeUrl]);

  return {
    selection,
    isSelected,
    toggleSelection,
    replaceSelection,
    clearSelection,
  };
};
