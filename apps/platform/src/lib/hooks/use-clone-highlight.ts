"use client";

import { useCallback, useContext, useEffect, useState } from "react";

import { CloneHighlightContext } from "@app/lib/contexts";

const FLASH_MS = 1400;

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

  const { highlightedId, markCloned, clearHighlight } = ctx;
  const isHighlighted = highlightedId === id;

  const [node, setNode] = useState<HTMLElement | null>(null);

  const setNodeCallback = useCallback((next: HTMLElement | null) => {
    setNode(next);
  }, []);

  useEffect(() => {
    if (!isHighlighted || node === null) {
      return;
    }

    node.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "nearest",
    });

    const timeout = setTimeout(() => {
      clearHighlight();
    }, FLASH_MS);

    return () => {
      clearTimeout(timeout);
    };
  }, [isHighlighted, node, clearHighlight]);

  return { markCloned, isHighlighted, setNode: setNodeCallback };
};
