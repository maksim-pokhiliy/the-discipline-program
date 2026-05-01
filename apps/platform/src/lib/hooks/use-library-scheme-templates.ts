"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  type CreateSchemeTemplateInput,
  type ListSchemeTemplatesResponse,
  type SchemeTemplate,
  type UpdateSchemeTemplateInput,
} from "@repo/contracts/lms/scheme-template";
import { notifyError } from "@repo/query";

import { api } from "../api";
import { platformKeys } from "../api/keys";

import { type LibraryListParams } from "./use-library-exercises";

const DEFAULT_TAKE = 100;

const buildSchemeTemplateQuery = (params: LibraryListParams, ownerId: string | undefined) => {
  const take = params.take ?? DEFAULT_TAKE;

  if (params.scope === "SYSTEM") {
    return { search: params.search, scope: "SYSTEM" as const, take };
  }

  if (params.scope === "OWN" && ownerId) {
    return { search: params.search, scope: "COACH" as const, ownerId, take };
  }

  return { search: params.search, take };
};

export const useSchemeTemplatesPageData = (params: LibraryListParams = {}, ownerId?: string) =>
  useQuery<ListSchemeTemplatesResponse>({
    queryKey: [
      ...platformKeys.library.schemeTemplates.page(),
      params.search ?? "",
      params.scope ?? "ALL",
      params.take ?? DEFAULT_TAKE,
      ownerId ?? "",
    ],
    queryFn: () => api.library.schemeTemplates.list(buildSchemeTemplateQuery(params, ownerId)),
  });

export const useSchemeTemplate = (id: string) =>
  useQuery({
    queryKey: platformKeys.library.schemeTemplates.byId(id),
    queryFn: () => api.library.schemeTemplates.getById(id),
    enabled: !!id,
  });

export const useCreateSchemeTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation<SchemeTemplate, Error, CreateSchemeTemplateInput>({
    mutationFn: (data) => api.library.schemeTemplates.create(data),
    onSuccess: () => {
      toast.success("Scheme template created");
      queryClient.invalidateQueries({ queryKey: platformKeys.library.schemeTemplates.page() });
    },
    onError: (error) => {
      notifyError(error, "Failed to create scheme template");
    },
  });
};

type UpdateSchemeTemplateVariables = {
  id: string;
  data: UpdateSchemeTemplateInput;
};

export const useUpdateSchemeTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation<SchemeTemplate, Error, UpdateSchemeTemplateVariables>({
    mutationFn: ({ id, data }) => api.library.schemeTemplates.update(id, data),
    onSuccess: (result) => {
      toast.success("Scheme template updated");
      queryClient.invalidateQueries({ queryKey: platformKeys.library.schemeTemplates.page() });
      queryClient.invalidateQueries({
        queryKey: platformKeys.library.schemeTemplates.byId(result.id),
      });
    },
    onError: (error) => {
      notifyError(error, "Failed to update scheme template");
    },
  });
};

export const useDeleteSchemeTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => api.library.schemeTemplates.delete(id),
    onSuccess: () => {
      toast.success("Scheme template deleted");
      queryClient.invalidateQueries({ queryKey: platformKeys.library.schemeTemplates.page() });
    },
    onError: (error) => {
      notifyError(error, "Failed to delete scheme template");
    },
  });
};

export const usePromoteSchemeTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.library.schemeTemplates.promote(id),
    onSuccess: () => {
      toast.success("Scheme template promoted to SYSTEM");
      queryClient.invalidateQueries({ queryKey: platformKeys.library.schemeTemplates.page() });
    },
    onError: (error) => {
      notifyError(error, "Failed to promote scheme template");
    },
  });
};

export const useDemoteSchemeTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, newOwnerId }: { id: string; newOwnerId: string }) =>
      api.library.schemeTemplates.demote(id, { newOwnerId }),
    onSuccess: () => {
      toast.success("Scheme template demoted to COACH");
      queryClient.invalidateQueries({ queryKey: platformKeys.library.schemeTemplates.page() });
    },
    onError: (error) => {
      notifyError(error, "Failed to demote scheme template");
    },
  });
};
