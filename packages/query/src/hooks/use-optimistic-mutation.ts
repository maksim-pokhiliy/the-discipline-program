"use client";

import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";

import { notifyError } from "./notify-error";

type ResolveFromVars<T, TVars> = T | ((vars: TVars) => T);

const isFunction = <T, TVars>(value: ResolveFromVars<T, TVars>): value is (vars: TVars) => T =>
  typeof value === "function";

const resolve = <T, TVars>(value: ResolveFromVars<T, TVars>, vars: TVars): T =>
  isFunction(value) ? value(vars) : value;

type OptimisticMutationConfig<TData, TVars, TResult = unknown> = {
  mutationFn: (vars: TVars) => Promise<TResult>;
  queryKey: ResolveFromVars<QueryKey, TVars>;
  transform: (previous: TData, vars: TVars) => TData;
  invalidateKeys: ResolveFromVars<QueryKey[], TVars>;
  errorMessage: string;
};

export const useOptimisticMutation = <TData, TVars, TResult = unknown>(
  config: OptimisticMutationConfig<TData, TVars, TResult>,
) => {
  const queryClient = useQueryClient();

  return useMutation<TResult, Error, TVars, { previous?: TData; queryKey: QueryKey }>({
    mutationFn: config.mutationFn,
    onMutate: async (vars) => {
      const queryKey = resolve(config.queryKey, vars);

      await queryClient.cancelQueries({ queryKey });

      const previous = queryClient.getQueryData<TData>(queryKey);

      if (previous !== undefined) {
        queryClient.setQueryData(queryKey, config.transform(previous, vars));
      }

      return { previous, queryKey };
    },
    onError: (error, _vars, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(context.queryKey, context.previous);
      }

      notifyError(error, config.errorMessage);
    },
    onSettled: (_data, _error, vars) => {
      const keys = resolve(config.invalidateKeys, vars);

      for (const key of keys) {
        queryClient.invalidateQueries({ queryKey: key });
      }
    },
  });
};
