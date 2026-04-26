"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  type CreateSchemeTemplateInput,
  type DemoteSchemeTemplateInput,
  type ListSchemeTemplatesResponse,
  type SchemeTemplate,
  type UpdateSchemeTemplateInput,
} from "@repo/contracts/lms/scheme-template";
import { createCrudHooks } from "@repo/query";

import { api } from "../api";
import { adminKeys } from "../api/keys";

import { useNavigate } from "./use-navigate";

const schemeTemplateLibraryHooks = createCrudHooks<
  ListSchemeTemplatesResponse,
  SchemeTemplate,
  CreateSchemeTemplateInput,
  UpdateSchemeTemplateInput
>({
  entityName: "Scheme template",
  keys: adminKeys.library.schemeTemplates,
  api: {
    getPageData: api.library.schemeTemplates.list,
    getById: api.library.schemeTemplates.getById,
    create: api.library.schemeTemplates.create,
    update: api.library.schemeTemplates.update,
    delete: api.library.schemeTemplates.delete,
  },
  redirectTo: "/library/scheme-templates",
  useNavigate,
});

export const useSchemeTemplatesPageData = schemeTemplateLibraryHooks.usePageData;
export const useCreateSchemeTemplate = schemeTemplateLibraryHooks.useCreate;
export const useUpdateSchemeTemplate = schemeTemplateLibraryHooks.useUpdate;
export const useDeleteSchemeTemplate = schemeTemplateLibraryHooks.useDelete;

export const useSchemeTemplate = (id: string) =>
  useQuery({
    queryKey: adminKeys.library.schemeTemplates.byId(id),
    queryFn: () => api.library.schemeTemplates.getById(id),
    enabled: !!id,
  });

export const usePromoteSchemeTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation<SchemeTemplate, Error, string>({
    mutationFn: (id) => api.library.schemeTemplates.promote(id),
    onSuccess: (result) => {
      toast.success("Scheme template promoted to SYSTEM");
      queryClient.invalidateQueries({ queryKey: adminKeys.library.schemeTemplates.page() });
      queryClient.invalidateQueries({
        queryKey: adminKeys.library.schemeTemplates.byId(result.id),
      });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to promote scheme template");
    },
  });
};

type DemoteVariables = {
  id: string;
  data: DemoteSchemeTemplateInput;
};

export const useDemoteSchemeTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation<SchemeTemplate, Error, DemoteVariables>({
    mutationFn: ({ id, data }) => api.library.schemeTemplates.demote(id, data),
    onSuccess: (result) => {
      toast.success("Scheme template demoted to COACH");
      queryClient.invalidateQueries({ queryKey: adminKeys.library.schemeTemplates.page() });
      queryClient.invalidateQueries({
        queryKey: adminKeys.library.schemeTemplates.byId(result.id),
      });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to demote scheme template");
    },
  });
};
