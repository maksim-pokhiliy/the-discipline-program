"use client";

import { createContext, type ReactNode } from "react";

import type { Label } from "@repo/contracts/lms/label";

import { useLabelSearch } from "@app/lib/hooks/use-label-search";

export type LabelOptionsLevel = "DAY" | "SESSION" | "BLOCK";

export type LabelOptionsValue = {
  options: Label[];
  isLoading: boolean;
};

export type LabelOptionsContextValue = Record<LabelOptionsLevel, LabelOptionsValue>;

export const LabelOptionsContext = createContext<LabelOptionsContextValue | null>(null);

type LabelOptionsProviderProps = {
  children: ReactNode;
};

export const LabelOptionsProvider = ({ children }: LabelOptionsProviderProps) => {
  const day = useLabelSearch({ level: "DAY" });
  const session = useLabelSearch({ level: "SESSION" });
  const block = useLabelSearch({ level: "BLOCK" });

  const value: LabelOptionsContextValue = {
    DAY: { options: day.data ?? [], isLoading: day.isLoading },
    SESSION: { options: session.data ?? [], isLoading: session.isLoading },
    BLOCK: { options: block.data ?? [], isLoading: block.isLoading },
  };

  return <LabelOptionsContext.Provider value={value}>{children}</LabelOptionsContext.Provider>;
};
