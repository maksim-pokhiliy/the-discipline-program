import type { QueryClient, QueryKey } from "@tanstack/react-query";

export type WithId = { id: string };
export type WithSortOrder = { sortOrder: number };

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

export const applyReorderSortOrder = <TItem extends WithId & Partial<WithSortOrder>>(
  items: TItem[],
): TItem[] => {
  return items.map((item, index) => ({ ...item, sortOrder: index + 1 }));
};

export const optimisticReorderPageList = <
  TPageData,
  TItem extends WithId & Partial<WithSortOrder>,
>(params: {
  queryClient: QueryClient;
  pageKey: QueryKey;
  getList: (page: TPageData) => TItem[];
  setList: (page: TPageData, next: TItem[]) => TPageData;
}) => {
  const { queryClient, pageKey, setList } = params;

  return {
    onMutate: async (reordered: TItem[]) => {
      await queryClient.cancelQueries({ queryKey: pageKey });

      const previous = queryClient.getQueryData<TPageData>(pageKey);

      queryClient.setQueryData<TPageData>(pageKey, (old) => {
        if (!old) {
          return old;
        }
        return setList(old, applyReorderSortOrder(reordered));
      });

      return { previous };
    },

    onError: (_err: unknown, _vars: TItem[], ctx?: { previous?: TPageData }) => {
      if (ctx?.previous) {
        queryClient.setQueryData(pageKey, ctx.previous);
      }
    },

    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: pageKey });
    },
  };
};
