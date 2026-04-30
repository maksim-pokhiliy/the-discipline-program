"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  type CreateWeekTemplateInput,
  type ListWeekTemplatesResponse,
  type UpdateWeekTemplateInput,
  type WeekTemplate,
} from "@repo/contracts/lms/week-template";
import { notifyError } from "@repo/query";

import { api } from "../api";
import { platformKeys } from "../api/keys";

import { type LibraryListParams } from "./use-library-exercises";

const DEFAULT_TAKE = 100;

const buildWeekTemplateQuery = (params: LibraryListParams, ownerId: string | undefined) => {
  const take = params.take ?? DEFAULT_TAKE;

  if (params.scope === "SYSTEM") {
    return { search: params.search, scope: "SYSTEM" as const, take };
  }

  if (params.scope === "OWN" && ownerId) {
    return { search: params.search, scope: "COACH" as const, ownerId, take };
  }

  return { search: params.search, take };
};

export const useWeekTemplatesPageData = (params: LibraryListParams = {}, ownerId?: string) =>
  useQuery<ListWeekTemplatesResponse>({
    queryKey: [
      ...platformKeys.library.weekTemplates.page(),
      params.search ?? "",
      params.scope ?? "ALL",
      params.take ?? DEFAULT_TAKE,
      ownerId ?? "",
    ],
    queryFn: () => api.library.weekTemplates.list(buildWeekTemplateQuery(params, ownerId)),
  });

export const useWeekTemplate = (id: string) =>
  useQuery({
    queryKey: platformKeys.library.weekTemplates.byId(id),
    queryFn: () => api.library.weekTemplates.getById(id),
    enabled: !!id,
  });

export const useCreateWeekTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation<WeekTemplate, Error, CreateWeekTemplateInput>({
    mutationFn: (data) => api.library.weekTemplates.create(data),
    onSuccess: () => {
      toast.success("Week template created");
      queryClient.invalidateQueries({ queryKey: platformKeys.library.weekTemplates.page() });
    },
    onError: (error) => {
      notifyError(error, "Failed to create week template");
    },
  });
};

type UpdateWeekTemplateVariables = {
  id: string;
  data: UpdateWeekTemplateInput;
};

export const useUpdateWeekTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation<WeekTemplate, Error, UpdateWeekTemplateVariables>({
    mutationFn: ({ id, data }) => api.library.weekTemplates.update(id, data),
    onSuccess: (result) => {
      toast.success("Week template updated");
      queryClient.invalidateQueries({ queryKey: platformKeys.library.weekTemplates.page() });
      queryClient.invalidateQueries({
        queryKey: platformKeys.library.weekTemplates.byId(result.id),
      });
    },
    onError: (error) => {
      notifyError(error, "Failed to update week template");
    },
  });
};

export const useDeleteWeekTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => api.library.weekTemplates.delete(id),
    onSuccess: () => {
      toast.success("Week template deleted");
      queryClient.invalidateQueries({ queryKey: platformKeys.library.weekTemplates.page() });
    },
    onError: (error) => {
      notifyError(error, "Failed to delete week template");
    },
  });
};

export const usePromoteWeekTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.library.weekTemplates.promote(id),
    onSuccess: () => {
      toast.success("Week template promoted to SYSTEM");
      queryClient.invalidateQueries({ queryKey: platformKeys.library.weekTemplates.page() });
    },
    onError: (error) => {
      notifyError(error, "Failed to promote week template");
    },
  });
};

export const useDemoteWeekTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, newOwnerId }: { id: string; newOwnerId: string }) =>
      api.library.weekTemplates.demote(id, { newOwnerId }),
    onSuccess: () => {
      toast.success("Week template demoted to COACH");
      queryClient.invalidateQueries({ queryKey: platformKeys.library.weekTemplates.page() });
    },
    onError: (error) => {
      notifyError(error, "Failed to demote week template");
    },
  });
};
