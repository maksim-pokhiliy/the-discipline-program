"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  type BlockKind,
  type CreateBlockKindInput,
  type ListBlockKindsResponse,
  type UpdateBlockKindInput,
} from "@repo/contracts/lms/block-kind";
import { notifyError } from "@repo/query";

import { api } from "../api";
import { platformKeys } from "../api/keys";

import { type LibraryListParams } from "./use-library-exercises";

const DEFAULT_TAKE = 100;

const buildBlockKindQuery = (params: LibraryListParams, ownerId: string | undefined) => {
  const take = params.take ?? DEFAULT_TAKE;

  if (params.scope === "SYSTEM") {
    return { search: params.search, scope: "SYSTEM" as const, take };
  }

  if (params.scope === "OWN" && ownerId) {
    return { search: params.search, scope: "COACH" as const, ownerId, take };
  }

  return { search: params.search, take };
};

export const useBlockKindsPageData = (params: LibraryListParams = {}, ownerId?: string) =>
  useQuery<ListBlockKindsResponse>({
    queryKey: [
      ...platformKeys.library.blockKinds.page(),
      params.search ?? "",
      params.scope ?? "ALL",
      params.take ?? DEFAULT_TAKE,
      ownerId ?? "",
    ],
    queryFn: () => api.library.blockKinds.list(buildBlockKindQuery(params, ownerId)),
  });

export const useBlockKind = (id: string) =>
  useQuery({
    queryKey: platformKeys.library.blockKinds.byId(id),
    queryFn: () => api.library.blockKinds.getById(id),
    enabled: !!id,
  });

export const useCreateBlockKind = () => {
  const queryClient = useQueryClient();

  return useMutation<BlockKind, Error, CreateBlockKindInput>({
    mutationFn: (data) => api.library.blockKinds.create(data),
    onSuccess: () => {
      toast.success("Block kind created");
      queryClient.invalidateQueries({ queryKey: platformKeys.library.blockKinds.page() });
    },
    onError: (error) => {
      notifyError(error, "Failed to create block kind");
    },
  });
};

type UpdateBlockKindVariables = {
  id: string;
  data: UpdateBlockKindInput;
};

export const useUpdateBlockKind = () => {
  const queryClient = useQueryClient();

  return useMutation<BlockKind, Error, UpdateBlockKindVariables>({
    mutationFn: ({ id, data }) => api.library.blockKinds.update(id, data),
    onSuccess: (result) => {
      toast.success("Block kind updated");
      queryClient.invalidateQueries({ queryKey: platformKeys.library.blockKinds.page() });
      queryClient.invalidateQueries({ queryKey: platformKeys.library.blockKinds.byId(result.id) });
    },
    onError: (error) => {
      notifyError(error, "Failed to update block kind");
    },
  });
};

export const useDeleteBlockKind = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => api.library.blockKinds.delete(id),
    onSuccess: () => {
      toast.success("Block kind deleted");
      queryClient.invalidateQueries({ queryKey: platformKeys.library.blockKinds.page() });
    },
    onError: (error) => {
      notifyError(error, "Failed to delete block kind");
    },
  });
};

export const usePromoteBlockKind = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.library.blockKinds.promote(id),
    onSuccess: () => {
      toast.success("Block kind promoted to SYSTEM");
      queryClient.invalidateQueries({ queryKey: platformKeys.library.blockKinds.page() });
    },
    onError: (error) => {
      notifyError(error, "Failed to promote block kind");
    },
  });
};

export const useDemoteBlockKind = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, newOwnerId }: { id: string; newOwnerId: string }) =>
      api.library.blockKinds.demote(id, { newOwnerId }),
    onSuccess: () => {
      toast.success("Block kind demoted to COACH");
      queryClient.invalidateQueries({ queryKey: platformKeys.library.blockKinds.page() });
    },
    onError: (error) => {
      notifyError(error, "Failed to demote block kind");
    },
  });
};
