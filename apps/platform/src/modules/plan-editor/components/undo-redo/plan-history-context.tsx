"use client";

import { createContext, useContext, type ReactNode } from "react";

import { type UsePlanHistoryApi } from "./use-undo-stack";

const PlanHistoryContext = createContext<UsePlanHistoryApi | null>(null);

export type PlanHistoryProviderProps = {
  history: UsePlanHistoryApi;
  children: ReactNode;
};

export const PlanHistoryProvider = ({ history, children }: PlanHistoryProviderProps) => (
  <PlanHistoryContext.Provider value={history}>{children}</PlanHistoryContext.Provider>
);

export const usePlanHistoryContext = (): UsePlanHistoryApi | null => useContext(PlanHistoryContext);
