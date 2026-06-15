"use client";

import { useCallback, useContext, useEffect, useRef } from "react";

import { CloneHighlightContext } from "@app/lib/contexts";

const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export type CloneHighlightValue = {
  markCloned: (id: string) => void;
  isHighlighted: boolean;
  setNode: (node: HTMLElement | null) => void;
};

export const useCloneHighlight = (id: string): CloneHighlightValue => {
  const ctx = useContext(CloneHighlightContext);

  if (ctx === null) {
    throw new Error("useCloneHighlight must be used within CloneHighlightProvider");
  }

  const { highlightedId, markCloned } = ctx;
  const isHighlighted = highlightedId === id;

  const nodeRef = useRef<HTMLElement | null>(null);

  const setNode = useCallback((node: HTMLElement | null) => {
    nodeRef.current = node;
  }, []);

  useEffect(() => {
    if (!isHighlighted || nodeRef.current === null) {
      return;
    }

    nodeRef.current.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "nearest",
    });
  }, [isHighlighted]);

  return { markCloned, isHighlighted, setNode };
};
