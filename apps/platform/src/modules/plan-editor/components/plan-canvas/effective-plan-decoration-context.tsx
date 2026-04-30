"use client";

import { createContext, useContext, type ReactNode } from "react";

import {
  type EffectivePlanDecorationApi,
  useEffectivePlanDecoration,
  type UseEffectivePlanDecorationParams,
} from "./use-effective-plan-decoration";

const NULL_API: EffectivePlanDecorationApi = {
  getDecoration: () => null,
};

const EffectivePlanDecorationContext = createContext<EffectivePlanDecorationApi>(NULL_API);

export type EffectivePlanDecorationProviderProps = UseEffectivePlanDecorationParams & {
  children: ReactNode;
};

export const EffectivePlanDecorationProvider = ({
  enrollmentId,
  fromWeek,
  toWeek,
  children,
}: EffectivePlanDecorationProviderProps) => {
  const api = useEffectivePlanDecoration({ enrollmentId, fromWeek, toWeek });

  return (
    <EffectivePlanDecorationContext.Provider value={api}>
      {children}
    </EffectivePlanDecorationContext.Provider>
  );
};

export const useEffectivePlanDecorationContext = (): EffectivePlanDecorationApi =>
  useContext(EffectivePlanDecorationContext);
