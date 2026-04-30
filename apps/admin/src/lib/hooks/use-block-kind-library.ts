"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  type BlockKind,
  type CreateBlockKindInput,
  type DemoteBlockKindInput,
  type ListBlockKindsResponse,
  type UpdateBlockKindInput,
} from "@repo/contracts/lms/block-kind";
import { createCrudHooks, notifyError } from "@repo/query";

import { api } from "../api";
import { adminKeys } from "../api/keys";

import { useNavigate } from "./use-navigate";

const blockKindLibraryHooks = createCrudHooks<
  ListBlockKindsResponse,
  BlockKind,
  CreateBlockKindInput,
  UpdateBlockKindInput
>({
  entityName: "Block kind",
  keys: adminKeys.library.blockKinds,
  api: {
    getPageData: api.library.blockKinds.list,
    getById: api.library.blockKinds.getById,
    create: api.library.blockKinds.create,
    update: api.library.blockKinds.update,
    delete: api.library.blockKinds.delete,
  },
  redirectTo: "/library/block-kinds",
  useNavigate,
});

export const useBlockKindsPageData = blockKindLibraryHooks.usePageData;
export const useCreateBlockKind = blockKindLibraryHooks.useCreate;
export const useUpdateBlockKind = blockKindLibraryHooks.useUpdate;
export const useDeleteBlockKind = blockKindLibraryHooks.useDelete;

export const useBlockKind = (id: string) =>
  useQuery({
    queryKey: adminKeys.library.blockKinds.byId(id),
    queryFn: () => api.library.blockKinds.getById(id),
    enabled: !!id,
  });

export const usePromoteBlockKind = () => {
  const queryClient = useQueryClient();

  return useMutation<BlockKind, Error, string>({
    mutationFn: (id) => api.library.blockKinds.promote(id),
    onSuccess: (result) => {
      toast.success("Block kind promoted to SYSTEM");
      queryClient.invalidateQueries({ queryKey: adminKeys.library.blockKinds.page() });
      queryClient.invalidateQueries({ queryKey: adminKeys.library.blockKinds.byId(result.id) });
    },
    onError: (error) => {
      notifyError(error, "Failed to promote block kind");
    },
  });
};

type DemoteVariables = {
  id: string;
  data: DemoteBlockKindInput;
};

export const useDemoteBlockKind = () => {
  const queryClient = useQueryClient();

  return useMutation<BlockKind, Error, DemoteVariables>({
    mutationFn: ({ id, data }) => api.library.blockKinds.demote(id, data),
    onSuccess: (result) => {
      toast.success("Block kind demoted to COACH");
      queryClient.invalidateQueries({ queryKey: adminKeys.library.blockKinds.page() });
      queryClient.invalidateQueries({ queryKey: adminKeys.library.blockKinds.byId(result.id) });
    },
    onError: (error) => {
      notifyError(error, "Failed to demote block kind");
    },
  });
};
