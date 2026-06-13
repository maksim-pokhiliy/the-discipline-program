"use client";

import { useEffect, useState } from "react";

export const useDebouncedValue = <TValue>(value: TValue, delayMs: number): TValue => {
  const [debounced, setDebounced] = useState<TValue>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(value);
    }, delayMs);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delayMs]);

  return debounced;
};
