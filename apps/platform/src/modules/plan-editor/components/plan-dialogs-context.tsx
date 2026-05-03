"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import { useSearchParams } from "next/navigation";

import { usePlanStructure } from "@app/lib/hooks";

import { AddWeekDialog } from "./plan-canvas/add-week-dialog";

export type PlanDialogsContextValue = {
  isAddWeekOpen: boolean;
  openAddWeek: () => void;
  closeAddWeek: () => void;
};

const PlanDialogsContext = createContext<PlanDialogsContextValue | null>(null);

export type PlanDialogsProviderProps = {
  planId: string;
  children: ReactNode;
};

const computeDefaultWeekIndex = (weeksLength: number, maxIndex: number): number =>
  weeksLength === 0 ? 0 : maxIndex + 1;

export const PlanDialogsProvider = ({ planId, children }: PlanDialogsProviderProps) => {
  const [isAddWeekOpen, setIsAddWeekOpen] = useState(false);

  const searchParams = useSearchParams();
  const fromParam = searchParams.get("fromWeek");
  const toParam = searchParams.get("toWeek");
  const fromWeek = fromParam !== null ? Number(fromParam) : undefined;
  const toWeek = toParam !== null ? Number(toParam) : undefined;

  const { data } = usePlanStructure(planId, { fromWeek, toWeek });

  const openAddWeek = useCallback(() => {
    setIsAddWeekOpen(true);
  }, []);

  const closeAddWeek = useCallback(() => {
    setIsAddWeekOpen(false);
  }, []);

  const value = useMemo<PlanDialogsContextValue>(
    () => ({ isAddWeekOpen, openAddWeek, closeAddWeek }),
    [closeAddWeek, isAddWeekOpen, openAddWeek],
  );

  const defaultIndex = computeDefaultWeekIndex(
    data?.plan.weeks.length ?? 0,
    data?.window.maxIndex ?? 0,
  );

  return (
    <PlanDialogsContext.Provider value={value}>
      {children}
      <AddWeekDialog
        isOpen={isAddWeekOpen}
        onClose={closeAddWeek}
        planId={planId}
        defaultIndex={defaultIndex}
      />
    </PlanDialogsContext.Provider>
  );
};

export const usePlanDialogs = (): PlanDialogsContextValue => {
  const ctx = useContext(PlanDialogsContext);

  if (!ctx) {
    throw new Error("usePlanDialogs must be used inside <PlanDialogsProvider>");
  }

  return ctx;
};
