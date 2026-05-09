"use client";

import { useCallback, useRef } from "react";

export const useSubmitGuard = <TArgs extends readonly unknown[]>(
  submit: (...args: TArgs) => Promise<void>,
): ((...args: TArgs) => Promise<void>) => {
  const inFlightRef = useRef(false);

  return useCallback(
    async (...args: TArgs): Promise<void> => {
      if (inFlightRef.current) {
        return;
      }

      inFlightRef.current = true;

      try {
        await submit(...args);
      } finally {
        inFlightRef.current = false;
      }
    },
    [submit],
  );
};
