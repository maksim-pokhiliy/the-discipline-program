"use client";

import { useEffect } from "react";

import { useMutation, useQueryClient, type UseMutationResult } from "@tanstack/react-query";

export const useScopedMutation = <TVars, TResult>(
  mutationKey: readonly unknown[],
  scopeId: string,
  mutationFn: (vars: TVars) => Promise<TResult>,
): UseMutationResult<TResult, Error, TVars> => {
  const queryClient = useQueryClient();

  useEffect(() => {
    queryClient.setMutationDefaults(mutationKey, {
      mutationFn: mutationFn as (vars: unknown) => Promise<unknown>,
      scope: { id: scopeId },
    });

    return () => {
      queryClient.setMutationDefaults(mutationKey, {});
    };
  }, [queryClient, mutationKey, scopeId, mutationFn]);

  return useMutation<TResult, Error, TVars>({ mutationKey });
};
