"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  type BlockTemplate,
  type CreateBlockTemplateInput,
  type DemoteBlockTemplateInput,
  type ListBlockTemplatesResponse,
  type UpdateBlockTemplateInput,
} from "@repo/contracts/lms/block-template";
import { createCrudHooks } from "@repo/query";

import { api } from "../api";
import { adminKeys } from "../api/keys";

import { useNavigate } from "./use-navigate";

const blockTemplateLibraryHooks = createCrudHooks<
  ListBlockTemplatesResponse,
  BlockTemplate,
  CreateBlockTemplateInput,
  UpdateBlockTemplateInput
>({
  entityName: "Block template",
  keys: adminKeys.library.blockTemplates,
  api: {
    getPageData: api.library.blockTemplates.list,
    getById: api.library.blockTemplates.getById,
    create: api.library.blockTemplates.create,
    update: api.library.blockTemplates.update,
    delete: api.library.blockTemplates.delete,
  },
  redirectTo: "/library/block-templates",
  useNavigate,
});

export const useBlockTemplatesPageData = blockTemplateLibraryHooks.usePageData;
export const useCreateBlockTemplate = blockTemplateLibraryHooks.useCreate;
export const useUpdateBlockTemplate = blockTemplateLibraryHooks.useUpdate;
export const useDeleteBlockTemplate = blockTemplateLibraryHooks.useDelete;

export const useBlockTemplate = (id: string) =>
  useQuery({
    queryKey: adminKeys.library.blockTemplates.byId(id),
    queryFn: () => api.library.blockTemplates.getById(id),
    enabled: !!id,
  });

export const usePromoteBlockTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation<BlockTemplate, Error, string>({
    mutationFn: (id) => api.library.blockTemplates.promote(id),
    onSuccess: (result) => {
      toast.success("Block template promoted to SYSTEM");
      queryClient.invalidateQueries({ queryKey: adminKeys.library.blockTemplates.page() });
      queryClient.invalidateQueries({
        queryKey: adminKeys.library.blockTemplates.byId(result.id),
      });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to promote block template");
    },
  });
};

type DemoteVariables = {
  id: string;
  data: DemoteBlockTemplateInput;
};

export const useDemoteBlockTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation<BlockTemplate, Error, DemoteVariables>({
    mutationFn: ({ id, data }) => api.library.blockTemplates.demote(id, data),
    onSuccess: (result) => {
      toast.success("Block template demoted to COACH");
      queryClient.invalidateQueries({ queryKey: adminKeys.library.blockTemplates.page() });
      queryClient.invalidateQueries({
        queryKey: adminKeys.library.blockTemplates.byId(result.id),
      });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to demote block template");
    },
  });
};
