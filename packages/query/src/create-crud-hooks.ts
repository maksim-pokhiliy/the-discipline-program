"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface CrudHooksConfig<
  TPageData,
  TEntity extends { id: string },
  TCreateData = never,
  TUpdateData = never,
> {
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
  redirectTo: string;
  additionalInvalidateKeys?: QueryKey[];
}

interface CrudHooks<TPageData, TEntity extends { id: string }, TCreateData, TUpdateData> {
  usePageData: () => UseQueryResult<TPageData, Error>;
  useById: (id: string) => UseQueryResult<TEntity, Error>;
  useCreate: () => UseMutationResult<TEntity, Error, TCreateData>;
  useUpdate: () => UseMutationResult<TEntity, Error, { id: string; data: TUpdateData }>;
  useDelete: () => UseMutationResult<void, Error, string>;
}

export const createCrudHooks = <
  TPageData,
  TEntity extends { id: string },
  TCreateData = never,
  TUpdateData = never,
>(
  config: CrudHooksConfig<TPageData, TEntity, TCreateData, TUpdateData>,
): CrudHooks<TPageData, TEntity, TCreateData, TUpdateData> => {
  const invalidateKeys = config.additionalInvalidateKeys ?? [];

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
    const router = useRouter();

    return useMutation({
      mutationFn: (data: TCreateData) => {
        if (!config.api.create) {
          throw new Error(`Create is not supported for ${config.entityName}`);
        }

        return config.api.create(data);
      },
      onSuccess: () => {
        toast.success(`${config.entityName} created successfully`);
        queryClient.invalidateQueries({ queryKey: config.keys.page() });
        for (const key of invalidateKeys) {
          queryClient.invalidateQueries({ queryKey: key });
        }
        router.push(config.redirectTo);
      },
      onError: (error: Error) => {
        toast.error(error.message || `Failed to create ${config.entityName.toLowerCase()}`);
      },
    });
  };

  const useUpdate = () => {
    const queryClient = useQueryClient();
    const router = useRouter();

    return useMutation({
      mutationFn: ({ id, data }: { id: string; data: TUpdateData }) => {
        if (!config.api.update) {
          throw new Error(`Update is not supported for ${config.entityName}`);
        }

        return config.api.update(id, data);
      },
      onSuccess: (result: TEntity) => {
        toast.success(`${config.entityName} updated successfully`);
        queryClient.invalidateQueries({ queryKey: config.keys.page() });
        queryClient.invalidateQueries({
          queryKey: config.keys.byId(result.id),
        });
        for (const key of invalidateKeys) {
          queryClient.invalidateQueries({ queryKey: key });
        }
        router.push(config.redirectTo);
      },
      onError: (error: Error) => {
        toast.error(error.message || `Failed to update ${config.entityName.toLowerCase()}`);
      },
    });
  };

  const useDelete = () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (id: string) => {
        if (!config.api.delete) {
          throw new Error(`Delete is not supported for ${config.entityName}`);
        }

        return config.api.delete(id);
      },
      onSuccess: () => {
        toast.success(`${config.entityName} deleted successfully`);
        queryClient.invalidateQueries({ queryKey: config.keys.page() });
        for (const key of invalidateKeys) {
          queryClient.invalidateQueries({ queryKey: key });
        }
      },
      onError: (error: Error) => {
        toast.error(error.message || `Failed to delete ${config.entityName.toLowerCase()}`);
      },
    });
  };

  return { usePageData, useById, useCreate, useUpdate, useDelete };
};
