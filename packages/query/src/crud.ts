import type { QueryClient, QueryKey } from "@tanstack/react-query";
import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { invalidateMany } from "./client";

type WithId = { id: string };
type WithSortOrder = { sortOrder: number };

type CreateFn<TItem, TCreate> = (data: TCreate) => Promise<TItem>;
type UpdateFn<TItem, TUpdate> = (id: string, data: TUpdate) => Promise<TItem>;
type DeleteFn = (id: string) => Promise<void>;
type ToggleFn<TItem> = (id: string) => Promise<TItem>;
type GetByIdFn<TItem> = (id: string) => Promise<TItem>;
type GetPageDataFn<TPageData> = () => Promise<TPageData>;
type UpdateOrderFn<TOrderUpdate> = (updates: TOrderUpdate[]) => Promise<unknown>;

type BaseApi<TPageData, TItem extends WithId> = {
  getPageData: GetPageDataFn<TPageData>;
  getById?: GetByIdFn<TItem>;
};

type OptionalOpsApi<TItem extends WithId, TCreate, TUpdate, TOrderUpdate> = {
  create?: CreateFn<TItem, TCreate>;
  update?: UpdateFn<TItem, TUpdate>;
  delete?: DeleteFn;
  toggle?: ToggleFn<TItem>;
  updateOrder?: UpdateOrderFn<TOrderUpdate>;
};

export type PageDataCrudConfig<
  TPageData extends object,
  TItem extends WithId,
  TItemsKey extends keyof TPageData,
  TStatsKey extends keyof TPageData | undefined,
  TCreate,
  TUpdate,
  TOrderUpdate,
  TApi extends BaseApi<TPageData, TItem> & OptionalOpsApi<TItem, TCreate, TUpdate, TOrderUpdate>,
> = {
  keys: {
    page: () => QueryKey;
    byId?: (id: string) => QueryKey;
    invalidate?: () => QueryKey[];
  };

  api: TApi;

  fields: {
    items: TItemsKey;
    stats?: TStatsKey;
  };
};

type MutationsResult<TApi, TItem, TCreate, TUpdate, TOrderUpdate> = {
  createItem: "create" extends keyof TApi
    ? UseMutationResult<TItem, Error, TCreate, { previous?: unknown }>
    : undefined;

  updateItem: "update" extends keyof TApi
    ? UseMutationResult<TItem, Error, { id: string; data: TUpdate }, { previous?: unknown }>
    : undefined;

  deleteItem: "delete" extends keyof TApi
    ? UseMutationResult<void, Error, string, { previous?: unknown }>
    : undefined;

  toggleItem: "toggle" extends keyof TApi
    ? UseMutationResult<TItem, Error, string, { previous?: unknown }>
    : undefined;

  updateOrder: "updateOrder" extends keyof TApi
    ? UseMutationResult<unknown, Error, TOrderUpdate[], { previous?: unknown }>
    : undefined;
};

const sortBySortOrder = <T extends WithSortOrder>(a: T, b: T) => a.sortOrder - b.sortOrder;

const applyOrderUpdates = <
  TItem extends WithId & WithSortOrder,
  TUpdate extends WithId & Partial<WithSortOrder>,
>(
  items: readonly TItem[],
  updates: readonly TUpdate[],
): TItem[] => {
  const updatesMap = new Map<string, TUpdate>(updates.map((update) => [update.id, update]));

  const next = items.map((item) => {
    const update = updatesMap.get(item.id);

    if (!update) {
      return item;
    }

    return { ...item, sortOrder: update.sortOrder ?? item.sortOrder };
  });

  return [...next].sort(sortBySortOrder);
};

const optimisticSetPageData = <TPageData>(
  queryClient: QueryClient,
  pageKey: QueryKey,
  updater: (old: TPageData | undefined) => TPageData | undefined,
) => {
  queryClient.setQueryData<TPageData>(pageKey, (old) => updater(old));
};

export const createPageDataCrudHooks = <
  TPageData extends object,
  TItem extends WithId,
  TItemsKey extends keyof TPageData,
  TStatsKey extends keyof TPageData | undefined = undefined,
  TCreate = Partial<TItem>,
  TUpdate extends Partial<TItem> = Partial<TItem>,
  TOrderUpdate extends WithId & Partial<WithSortOrder> = WithId & { sortOrder: number },
  TApi extends BaseApi<TPageData, TItem> &
    OptionalOpsApi<TItem, TCreate, TUpdate, TOrderUpdate> = BaseApi<TPageData, TItem> &
    OptionalOpsApi<TItem, TCreate, TUpdate, TOrderUpdate>,
>(
  config: PageDataCrudConfig<
    TPageData,
    TItem,
    TItemsKey,
    TStatsKey,
    TCreate,
    TUpdate,
    TOrderUpdate,
    TApi
  >,
) => {
  const pageKey = config.keys.page;

  const invalidate = async (queryClient: QueryClient) => {
    const extra = config.keys.invalidate ? config.keys.invalidate() : [];

    await invalidateMany(queryClient, [pageKey(), ...extra]);
  };

  const usePageData = () =>
    useQuery({
      queryKey: pageKey(),
      queryFn: config.api.getPageData,
    });

  const useItems = () =>
    useQuery({
      queryKey: pageKey(),
      queryFn: config.api.getPageData,
      select: (data) => data[config.fields.items] as TPageData[TItemsKey],
    });

  const useStats = () => {
    const statsKey = config.fields.stats;
    if (!statsKey) {
      throw new Error("createPageDataCrudHooks: stats field is not configured");
    }

    return useQuery({
      queryKey: pageKey(),
      queryFn: config.api.getPageData,
      select: (data) => data[statsKey] as TPageData[NonNullable<TStatsKey>],
    });
  };

  const useById = (id: string) => {
    if (!config.keys.byId || !config.api.getById) {
      throw new Error("createPageDataCrudHooks: byId is not configured");
    }

    return useQuery({
      queryKey: config.keys.byId(id),
      queryFn: () => config.api.getById!(id),
      enabled: !!id,
    });
  };

  const useMutations = (): MutationsResult<TApi, TItem, TCreate, TUpdate, TOrderUpdate> => {
    const queryClient = useQueryClient();
    const pk = pageKey();

    const createItem =
      "create" in config.api && typeof config.api.create === "function"
        ? useMutation({
            mutationFn: config.api.create,

            onMutate: async () => {
              await queryClient.cancelQueries({ queryKey: pk });

              const previous = queryClient.getQueryData(pk);

              return { previous };
            },

            onError: (_err, _vars, ctx) => {
              if (ctx?.previous) {
                queryClient.setQueryData(pk, ctx.previous);
              }
            },

            onSettled: async () => {
              await invalidate(queryClient);
            },
          })
        : undefined;

    const updateItem =
      "update" in config.api && typeof config.api.update === "function"
        ? useMutation({
            mutationFn: ({ id, data }: { id: string; data: TUpdate }) =>
              config.api.update!(id, data),

            onMutate: async ({ id, data }) => {
              await queryClient.cancelQueries({ queryKey: pk });

              const previous = queryClient.getQueryData(pk);

              optimisticSetPageData<TPageData>(queryClient, pk, (old) => {
                if (!old) {
                  return old;
                }

                const list = old[config.fields.items];

                if (!Array.isArray(list)) {
                  return old;
                }

                const next = (list as unknown as TItem[]).map((item) =>
                  item.id === id ? ({ ...item, ...data } as TItem) : item,
                );

                return { ...old, [config.fields.items]: next } as TPageData;
              });

              return { previous };
            },

            onError: (_err, _vars, ctx) => {
              if (ctx?.previous) {
                queryClient.setQueryData(pk, ctx.previous);
              }
            },

            onSettled: async () => {
              await invalidate(queryClient);
            },
          })
        : undefined;

    const deleteItem =
      "delete" in config.api && typeof config.api.delete === "function"
        ? useMutation({
            mutationFn: (id: string) => config.api.delete!(id),

            onMutate: async (id) => {
              await queryClient.cancelQueries({ queryKey: pk });

              const previous = queryClient.getQueryData(pk);

              optimisticSetPageData<TPageData>(queryClient, pk, (old) => {
                if (!old) {
                  return old;
                }

                const list = old[config.fields.items];

                if (!Array.isArray(list)) {
                  return old;
                }

                const next = (list as unknown as TItem[]).filter((it) => it.id !== id);

                return { ...old, [config.fields.items]: next } as TPageData;
              });

              return { previous };
            },

            onError: (_err, _vars, ctx) => {
              if (ctx?.previous) {
                queryClient.setQueryData(pk, ctx.previous);
              }
            },

            onSettled: async () => {
              await invalidate(queryClient);
            },
          })
        : undefined;

    const toggleItem =
      "toggle" in config.api && typeof config.api.toggle === "function"
        ? useMutation({
            mutationFn: (id: string) => config.api.toggle!(id),

            onMutate: async () => {
              await queryClient.cancelQueries({ queryKey: pk });

              const previous = queryClient.getQueryData(pk);

              return { previous };
            },

            onError: (_err, _vars, ctx) => {
              if (ctx?.previous) {
                queryClient.setQueryData(pk, ctx.previous);
              }
            },

            onSettled: async () => {
              await invalidate(queryClient);
            },
          })
        : undefined;

    const updateOrder =
      "updateOrder" in config.api && typeof config.api.updateOrder === "function"
        ? useMutation({
            mutationFn: (updates: TOrderUpdate[]) => config.api.updateOrder!(updates),

            onMutate: async (updates) => {
              await queryClient.cancelQueries({ queryKey: pk });

              const previous = queryClient.getQueryData(pk);

              optimisticSetPageData<TPageData>(queryClient, pk, (old) => {
                if (!old) {
                  return old;
                }

                const list = old[config.fields.items];

                if (!Array.isArray(list)) {
                  return old;
                }

                const next = applyOrderUpdates(
                  list as unknown as (TItem & WithSortOrder)[],
                  updates,
                );

                return { ...old, [config.fields.items]: next } as TPageData;
              });

              return { previous };
            },

            onError: (_err, _vars, ctx) => {
              if (ctx?.previous) {
                queryClient.setQueryData(pk, ctx.previous);
              }
            },

            onSettled: async () => {
              await invalidate(queryClient);
            },
          })
        : undefined;

    return {
      createItem: createItem as MutationsResult<
        TApi,
        TItem,
        TCreate,
        TUpdate,
        TOrderUpdate
      >["createItem"],

      updateItem: updateItem as MutationsResult<
        TApi,
        TItem,
        TCreate,
        TUpdate,
        TOrderUpdate
      >["updateItem"],

      deleteItem: deleteItem as MutationsResult<
        TApi,
        TItem,
        TCreate,
        TUpdate,
        TOrderUpdate
      >["deleteItem"],

      toggleItem: toggleItem as MutationsResult<
        TApi,
        TItem,
        TCreate,
        TUpdate,
        TOrderUpdate
      >["toggleItem"],

      updateOrder: updateOrder as MutationsResult<
        TApi,
        TItem,
        TCreate,
        TUpdate,
        TOrderUpdate
      >["updateOrder"],
    };
  };

  return { usePageData, useItems, useStats, useById, useMutations };
};
