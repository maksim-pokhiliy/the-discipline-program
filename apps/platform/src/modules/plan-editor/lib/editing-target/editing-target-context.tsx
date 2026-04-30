"use client";

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { ALL_TARGET, editingTargetEquals, formatEditingTarget, parseEditingTarget } from "./parse";
import { type EditingTarget, type EditingTargetContextValue } from "./types";

const EditingTargetContext = createContext<EditingTargetContextValue | null>(null);

const TARGET_PARAM = "target";

export type EditingTargetProviderProps = {
  children: ReactNode;
};

export const EditingTargetProvider = ({ children }: EditingTargetProviderProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const target = useMemo<EditingTarget>(
    () => parseEditingTarget(searchParams.get(TARGET_PARAM)),
    [searchParams],
  );

  const setTarget = useCallback(
    (next: EditingTarget) => {
      if (editingTargetEquals(target, next)) {
        return;
      }

      const params = new URLSearchParams(searchParams.toString());
      const formatted = formatEditingTarget(next);

      if (formatted === null) {
        params.delete(TARGET_PARAM);
      } else {
        params.set(TARGET_PARAM, formatted);
      }

      params.delete("selected");

      const query = params.toString();

      router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams, target],
  );

  const value = useMemo<EditingTargetContextValue>(
    () => ({ target, setTarget }),
    [setTarget, target],
  );

  return <EditingTargetContext.Provider value={value}>{children}</EditingTargetContext.Provider>;
};

export const useEditingTarget = (): EditingTargetContextValue => {
  const value = useContext(EditingTargetContext);

  if (!value) {
    return { target: ALL_TARGET, setTarget: () => undefined };
  }

  return value;
};
