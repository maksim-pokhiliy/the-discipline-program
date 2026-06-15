"use client";

import { createContext, type ReactNode, useCallback, useMemo, useRef, useState } from "react";

export type CloneHighlightContextValue = {
  highlightedId: string | null;
  markCloned: (id: string) => void;
};

export const CloneHighlightContext = createContext<CloneHighlightContextValue | null>(null);

const HIGHLIGHT_DURATION_MS = 1400;

type CloneHighlightProviderProps = {
  children: ReactNode;
};

export const CloneHighlightProvider = ({ children }: CloneHighlightProviderProps) => {
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const markCloned = useCallback((id: string) => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
    }

    setHighlightedId(id);

    timeoutRef.current = setTimeout(() => {
      setHighlightedId(null);
      timeoutRef.current = null;
    }, HIGHLIGHT_DURATION_MS);
  }, []);

  const value = useMemo<CloneHighlightContextValue>(
    () => ({ highlightedId, markCloned }),
    [highlightedId, markCloned],
  );

  return <CloneHighlightContext.Provider value={value}>{children}</CloneHighlightContext.Provider>;
};
