"use client";

import { createContext, type ReactNode, useMemo } from "react";

import type { Archetype } from "@repo/contracts/lms/archetype";
import type { Exercise } from "@repo/contracts/lms/exercise";

import { useArchetypes } from "@app/lib/hooks/use-archetypes";
import { useExercises } from "@app/lib/hooks/use-exercises";

export type CatalogContextValue = {
  exerciseById: ReadonlyMap<string, Exercise>;
  archetypeById: ReadonlyMap<string, Archetype>;
};

export const CatalogContext = createContext<CatalogContextValue | null>(null);

type CatalogProviderProps = {
  children: ReactNode;
};

export const CatalogProvider = ({ children }: CatalogProviderProps) => {
  const exercises = useExercises();
  const archetypes = useArchetypes();

  const value = useMemo<CatalogContextValue>(
    () => ({
      exerciseById: new Map((exercises.data ?? []).map((e) => [e.id, e])),
      archetypeById: new Map((archetypes.data ?? []).map((a) => [a.id, a])),
    }),
    [exercises.data, archetypes.data],
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
};
