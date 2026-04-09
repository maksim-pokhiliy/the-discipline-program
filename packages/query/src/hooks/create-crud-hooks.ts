"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import { toast } from "sonner";

type NavigateHook = () => (path: string) => void;

const noopNavigateHook: NavigateHook = () => () => {};

type CrudHooksConfig<
  TPageData,
  TEntity extends { id: string },
  TCreateData = never,
  TUpdateData = never,
> = {
  entityName: string;
  keys: {
    page: () => QueryKey;
    byId: (id: string) => QueryKey;
  };
  api: {
    getPageData: () => Promise<TPageData>;
    getById: (id: string) => Promise<TEntity>;
    create?: (data: TCreateData) => Promise<TEntity>;
    update?: (id: string, data: TUpdateData) => Promise<TEntity>;
    delete?: (id: string) => Promise<void>;
  };
  redirectTo?: string;
  useNavigate?: NavigateHook;
  additionalInvalidateKeys?: QueryKey[];
};

type CrudHooks<TPageData, TEntity extends { id: string }, TCreateData, TUpdateData> = {
  usePageData: () => UseQueryResult<TPageData, Error>;
  useById: (id: string) => UseQueryResult<TEntity, Error>;
  useCreate: () => UseMutationResult<TEntity, Error, TCreateData>;
  useUpdate: () => UseMutationResult<TEntity, Error, { id: string; data: TUpdateData }>;
  useDelete: () => UseMutationResult<void, Error, string>;
};

export const createCrudHooks = <
  TPageData,
  TEntity extends { id: string },
  TCreateData = never,
  TUpdateData = never,
>(
  config: CrudHooksConfig<TPageData, TEntity, TCreateData, TUpdateData>,
): CrudHooks<TPageData, TEntity, TCreateData, TUpdateData> => {
  const extraKeys = config.additionalInvalidateKeys ?? [];
  const entityName = config.entityName;

  const notifySuccess = (action: string) => {
    toast.success(`${entityName} ${action} successfully`);
  };

  const notifyError = (action: string, error: Error) => {
    toast.error(error.message || `Failed to ${action} ${entityName.toLowerCase()}`);
  };

  const invalidateRelated = (
    queryClient: ReturnType<typeof useQueryClient>,
    additionalKeys: QueryKey[] = [],
  ) => {
    queryClient.invalidateQueries({ queryKey: config.keys.page() });
    for (const key of [...extraKeys, ...additionalKeys]) {
      queryClient.invalidateQueries({ queryKey: key });
    }
  };

  const usePageData = () =>
    useQuery({
      queryKey: config.keys.page(),
      queryFn: config.api.getPageData,
    });

  const useById = (id: string) =>
    useQuery({
      queryKey: config.keys.byId(id),
      queryFn: () => config.api.getById(id),
      enabled: !!id,
    });

  const useCreate = () => {
    const queryClient = useQueryClient();
    const navigate = (config.useNavigate ?? noopNavigateHook)();

    return useMutation({
      mutationFn: (data: TCreateData) => {
        if (!config.api.create) {
          throw new Error(`Create is not supported for ${entityName}`);
        }

        return config.api.create(data);
      },
      onSuccess: () => {
        notifySuccess("created");
        invalidateRelated(queryClient);

        if (config.redirectTo) {
          navigate(config.redirectTo);
        }
      },
      onError: (error: Error) => {
        notifyError("create", error);
      },
    });
  };

  const useUpdate = () => {
    const queryClient = useQueryClient();
    const navigate = (config.useNavigate ?? noopNavigateHook)();

    return useMutation({
      mutationFn: ({ id, data }: { id: string; data: TUpdateData }) => {
        if (!config.api.update) {
          throw new Error(`Update is not supported for ${entityName}`);
        }

        return config.api.update(id, data);
      },
      onSuccess: (result: TEntity) => {
        notifySuccess("updated");
        invalidateRelated(queryClient, [config.keys.byId(result.id)]);

        if (config.redirectTo) {
          navigate(config.redirectTo);
        }
      },
      onError: (error: Error) => {
        notifyError("update", error);
      },
    });
  };

  const useDelete = () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (id: string) => {
        if (!config.api.delete) {
          throw new Error(`Delete is not supported for ${entityName}`);
        }

        return config.api.delete(id);
      },
      onSuccess: () => {
        notifySuccess("deleted");
        invalidateRelated(queryClient);
      },
      onError: (error: Error) => {
        notifyError("delete", error);
      },
    });
  };

  return { usePageData, useById, useCreate, useUpdate, useDelete };
};
