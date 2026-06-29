"use client";

import { useMemo, useRef } from "react";

const mintToken = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `st-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

const DEFAULT_KEY = "";

export type SubmitToken = {
  get: (key?: string) => string;
  reset: (key?: string) => void;
};

export const useSubmitToken = (): SubmitToken => {
  const tokens = useRef<Map<string, string>>(new Map());

  return useMemo(
    () => ({
      get: (key = DEFAULT_KEY): string => {
        const existing = tokens.current.get(key);

        if (existing !== undefined) {
          return existing;
        }

        const minted = mintToken();

        tokens.current.set(key, minted);

        return minted;
      },
      reset: (key = DEFAULT_KEY): void => {
        tokens.current.delete(key);
      },
    }),
    [],
  );
};
