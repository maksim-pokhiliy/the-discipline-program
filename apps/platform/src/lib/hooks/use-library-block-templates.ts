"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  type BlockTemplate,
  type CreateBlockTemplateInput,
  type ListBlockTemplatesResponse,
  type UpdateBlockTemplateInput,
} from "@repo/contracts/lms/block-template";

import { api } from "../api";
import { platformKeys } from "../api/keys";

import { type LibraryListParams } from "./use-library-exercises";

const DEFAULT_TAKE = 100;

const buildBlockTemplateQuery = (params: LibraryListParams, ownerId: string | undefined) => {
  const take = params.take ?? DEFAULT_TAKE;

  if (params.scope === "SYSTEM") {
    return { search: params.search, scope: "SYSTEM" as const, take };
  }

  if (params.scope === "OWN" && ownerId) {
    return { search: params.search, scope: "COACH" as const, ownerId, take };
  }

  return { search: params.search, take };
};

export const useBlockTemplatesPageData = (params: LibraryListParams = {}, ownerId?: string) =>
  useQuery<ListBlockTemplatesResponse>({
    queryKey: [
      ...platformKeys.library.blockTemplates.page(),
      params.search ?? "",
      params.scope ?? "ALL",
      params.take ?? DEFAULT_TAKE,
      ownerId ?? "",
    ],
    queryFn: () => api.library.blockTemplates.list(buildBlockTemplateQuery(params, ownerId)),
  });

export const useBlockTemplate = (id: string) =>
  useQuery({
    queryKey: platformKeys.library.blockTemplates.byId(id),
    queryFn: () => api.library.blockTemplates.getById(id),
    enabled: !!id,
  });

export const useCreateBlockTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation<BlockTemplate, Error, CreateBlockTemplateInput>({
    mutationFn: (data) => api.library.blockTemplates.create(data),
    onSuccess: () => {
      toast.success("Block template created");
      queryClient.invalidateQueries({ queryKey: platformKeys.library.blockTemplates.page() });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create block template");
    },
  });
};

type UpdateBlockTemplateVariables = {
  id: string;
  data: UpdateBlockTemplateInput;
};

export const useUpdateBlockTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation<BlockTemplate, Error, UpdateBlockTemplateVariables>({
    mutationFn: ({ id, data }) => api.library.blockTemplates.update(id, data),
    onSuccess: (result) => {
      toast.success("Block template updated");
      queryClient.invalidateQueries({ queryKey: platformKeys.library.blockTemplates.page() });
      queryClient.invalidateQueries({
        queryKey: platformKeys.library.blockTemplates.byId(result.id),
      });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update block template");
    },
  });
};

export const useDeleteBlockTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => api.library.blockTemplates.delete(id),
    onSuccess: () => {
      toast.success("Block template deleted");
      queryClient.invalidateQueries({ queryKey: platformKeys.library.blockTemplates.page() });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete block template");
    },
  });
};

export const usePromoteBlockTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.library.blockTemplates.promote(id),
    onSuccess: () => {
      toast.success("Block template promoted to SYSTEM");
      queryClient.invalidateQueries({ queryKey: platformKeys.library.blockTemplates.page() });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to promote block template");
    },
  });
};

export const useDemoteBlockTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, newOwnerId }: { id: string; newOwnerId: string }) =>
      api.library.blockTemplates.demote(id, { newOwnerId }),
    onSuccess: () => {
      toast.success("Block template demoted to COACH");
      queryClient.invalidateQueries({ queryKey: platformKeys.library.blockTemplates.page() });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to demote block template");
    },
  });
};
