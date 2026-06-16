"use client";

import { useCallback, useRef, useState } from "react";

export type PromiseModalController<TArg, TResult> = {
  isOpen: boolean;
  arg: TArg | null;
  open: (arg: TArg) => Promise<TResult | null>;
  resolve: (result: TResult) => void;
  cancel: () => void;
};

export const usePromiseModal = <TArg, TResult>(): PromiseModalController<TArg, TResult> => {
  const [isOpen, setIsOpen] = useState(false);
  const [arg, setArg] = useState<TArg | null>(null);
  const resolverRef = useRef<((value: TResult | null) => void) | null>(null);

  const settle = useCallback((value: TResult | null): void => {
    const resolver = resolverRef.current;

    resolverRef.current = null;
    setIsOpen(false);
    setArg(null);

    if (resolver !== null) {
      resolver(value);
    }
  }, []);

  const open = useCallback((nextArg: TArg): Promise<TResult | null> => {
    setArg(nextArg);
    setIsOpen(true);

    return new Promise<TResult | null>((resolvePromise) => {
      resolverRef.current = resolvePromise;
    });
  }, []);

  const resolve = useCallback(
    (result: TResult): void => {
      settle(result);
    },
    [settle],
  );

  const cancel = useCallback((): void => {
    settle(null);
  }, [settle]);

  return { isOpen, arg, open, resolve, cancel };
};
