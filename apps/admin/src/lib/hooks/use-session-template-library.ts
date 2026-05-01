"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  type CreateSessionTemplateInput,
  type DemoteSessionTemplateInput,
  type ListSessionTemplatesResponse,
  type SessionTemplate,
  type UpdateSessionTemplateInput,
} from "@repo/contracts/lms/session-template";
import { createCrudHooks, notifyError } from "@repo/query";

import { api } from "../api";
import { adminKeys } from "../api/keys";

import { useNavigate } from "./use-navigate";

const sessionTemplateLibraryHooks = createCrudHooks<
  ListSessionTemplatesResponse,
  SessionTemplate,
  CreateSessionTemplateInput,
  UpdateSessionTemplateInput
>({
  entityName: "Session template",
  keys: adminKeys.library.sessionTemplates,
  api: {
    getPageData: api.library.sessionTemplates.list,
    getById: api.library.sessionTemplates.getById,
    create: api.library.sessionTemplates.create,
    update: api.library.sessionTemplates.update,
    delete: api.library.sessionTemplates.delete,
  },
  redirectTo: "/library/session-templates",
  useNavigate,
});

export const useSessionTemplatesPageData = sessionTemplateLibraryHooks.usePageData;
export const useCreateSessionTemplate = sessionTemplateLibraryHooks.useCreate;
export const useUpdateSessionTemplate = sessionTemplateLibraryHooks.useUpdate;
export const useDeleteSessionTemplate = sessionTemplateLibraryHooks.useDelete;

export const useSessionTemplate = (id: string) =>
  useQuery({
    queryKey: adminKeys.library.sessionTemplates.byId(id),
    queryFn: () => api.library.sessionTemplates.getById(id),
    enabled: !!id,
  });

export const usePromoteSessionTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation<SessionTemplate, Error, string>({
    mutationFn: (id) => api.library.sessionTemplates.promote(id),
    onSuccess: (result) => {
      toast.success("Session template promoted to SYSTEM");
      queryClient.invalidateQueries({ queryKey: adminKeys.library.sessionTemplates.page() });
      queryClient.invalidateQueries({
        queryKey: adminKeys.library.sessionTemplates.byId(result.id),
      });
    },
    onError: (error) => {
      notifyError(error, "Failed to promote session template");
    },
  });
};

type DemoteVariables = {
  id: string;
  data: DemoteSessionTemplateInput;
};

export const useDemoteSessionTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation<SessionTemplate, Error, DemoteVariables>({
    mutationFn: ({ id, data }) => api.library.sessionTemplates.demote(id, data),
    onSuccess: (result) => {
      toast.success("Session template demoted to COACH");
      queryClient.invalidateQueries({ queryKey: adminKeys.library.sessionTemplates.page() });
      queryClient.invalidateQueries({
        queryKey: adminKeys.library.sessionTemplates.byId(result.id),
      });
    },
    onError: (error) => {
      notifyError(error, "Failed to demote session template");
    },
  });
};
