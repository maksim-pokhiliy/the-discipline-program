"use client";

import { useMemo, useRef } from "react";

export type SubmitToken = {
  get: () => string;
  reset: () => void;
};

export const useSubmitToken = (): SubmitToken => {
  const ref = useRef<string | null>(null);

  ref.current ??= crypto.randomUUID();

  return useMemo(
    () => ({
      get: (): string => ref.current ?? (ref.current = crypto.randomUUID()),
      reset: (): void => {
        ref.current = crypto.randomUUID();
      },
    }),
    [],
  );
};
