"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  type CreateWeekTemplateInput,
  type DemoteWeekTemplateInput,
  type ListWeekTemplatesResponse,
  type UpdateWeekTemplateInput,
  type WeekTemplate,
} from "@repo/contracts/lms/week-template";
import { createCrudHooks, notifyError } from "@repo/query";

import { api } from "../api";
import { adminKeys } from "../api/keys";

import { useNavigate } from "./use-navigate";

const weekTemplateLibraryHooks = createCrudHooks<
  ListWeekTemplatesResponse,
  WeekTemplate,
  CreateWeekTemplateInput,
  UpdateWeekTemplateInput
>({
  entityName: "Week template",
  keys: adminKeys.library.weekTemplates,
  api: {
    getPageData: api.library.weekTemplates.list,
    getById: api.library.weekTemplates.getById,
    create: api.library.weekTemplates.create,
    update: api.library.weekTemplates.update,
    delete: api.library.weekTemplates.delete,
  },
  redirectTo: "/library/week-templates",
  useNavigate,
});

export const useWeekTemplatesPageData = weekTemplateLibraryHooks.usePageData;
export const useCreateWeekTemplate = weekTemplateLibraryHooks.useCreate;
export const useUpdateWeekTemplate = weekTemplateLibraryHooks.useUpdate;
export const useDeleteWeekTemplate = weekTemplateLibraryHooks.useDelete;

export const useWeekTemplate = (id: string) =>
  useQuery({
    queryKey: adminKeys.library.weekTemplates.byId(id),
    queryFn: () => api.library.weekTemplates.getById(id),
    enabled: !!id,
  });

export const usePromoteWeekTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation<WeekTemplate, Error, string>({
    mutationFn: (id) => api.library.weekTemplates.promote(id),
    onSuccess: (result) => {
      toast.success("Week template promoted to SYSTEM");
      queryClient.invalidateQueries({ queryKey: adminKeys.library.weekTemplates.page() });
      queryClient.invalidateQueries({
        queryKey: adminKeys.library.weekTemplates.byId(result.id),
      });
    },
    onError: (error) => {
      notifyError(error, "Failed to promote week template");
    },
  });
};

type DemoteVariables = {
  id: string;
  data: DemoteWeekTemplateInput;
};

export const useDemoteWeekTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation<WeekTemplate, Error, DemoteVariables>({
    mutationFn: ({ id, data }) => api.library.weekTemplates.demote(id, data),
    onSuccess: (result) => {
      toast.success("Week template demoted to COACH");
      queryClient.invalidateQueries({ queryKey: adminKeys.library.weekTemplates.page() });
      queryClient.invalidateQueries({
        queryKey: adminKeys.library.weekTemplates.byId(result.id),
      });
    },
    onError: (error) => {
      notifyError(error, "Failed to demote week template");
    },
  });
};
