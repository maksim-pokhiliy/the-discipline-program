"use client";

import { useCallback } from "react";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export const useUrlParams = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const push = useCallback(
    (params: URLSearchParams) => {
      const qs = params.toString();

      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname],
  );

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());

      params.set(key, value);
      push(params);
    },
    [searchParams, push],
  );

  const deleteParam = useCallback(
    (key: string) => {
      const params = new URLSearchParams(searchParams.toString());

      params.delete(key);
      push(params);
    },
    [searchParams, push],
  );

  return { searchParams, setParam, deleteParam, push };
};
