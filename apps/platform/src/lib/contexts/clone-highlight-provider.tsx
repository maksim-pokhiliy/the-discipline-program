"use client";

import { createContext, type ReactNode, useCallback, useMemo, useState } from "react";

export type CloneHighlightContextValue = {
  highlightedId: string | null;
  markCloned: (id: string) => void;
  clearHighlight: () => void;
};

export const CloneHighlightContext = createContext<CloneHighlightContextValue | null>(null);

type CloneHighlightProviderProps = {
  children: ReactNode;
};

export const CloneHighlightProvider = ({ children }: CloneHighlightProviderProps) => {
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const markCloned = useCallback((id: string) => {
    setHighlightedId(id);
  }, []);

  const clearHighlight = useCallback(() => {
    setHighlightedId(null);
  }, []);

  const value = useMemo<CloneHighlightContextValue>(
    () => ({ highlightedId, markCloned, clearHighlight }),
    [highlightedId, markCloned, clearHighlight],
  );

  return <CloneHighlightContext.Provider value={value}>{children}</CloneHighlightContext.Provider>;
};
