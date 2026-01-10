import type { QueryClient, QueryKey } from "@tanstack/react-query";

export type WithId = { id: string };

type Snapshot<TData> = {
  previous?: TData;
};

export const createOptimisticSingleHandler = <TVars, TData>(params: {
  queryClient: QueryClient;
  cancelKeys: QueryKey[];
  key: QueryKey;
  invalidateKeys: QueryKey[];
  exact?: boolean;
  update: (old: TData | undefined, vars: TVars) => TData | undefined;
}) => {
  const { queryClient, cancelKeys, key, update, invalidateKeys, exact } = params;

  return {
    onMutate: async (vars: TVars): Promise<Snapshot<TData>> => {
      await Promise.all(cancelKeys.map((k) => queryClient.cancelQueries({ queryKey: k })));

      const previous = queryClient.getQueryData<TData>(key);

      queryClient.setQueryData<TData>(key, (old) => update(old, vars));

      return { previous };
    },

    onError: (_err: unknown, _vars: TVars, context?: Snapshot<TData>) => {
      if (!context) {
        return;
      }

      if (typeof context.previous !== "undefined") {
        queryClient.setQueryData(key, context.previous);
      }
    },

    onSettled: async () => {
      await Promise.all(
        invalidateKeys.map((k) =>
          queryClient.invalidateQueries({
            queryKey: k,
            exact: exact ?? false,
          }),
        ),
      );
    },
  };
};
