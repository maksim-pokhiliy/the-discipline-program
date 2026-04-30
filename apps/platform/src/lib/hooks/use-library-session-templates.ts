"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  type CreateSessionTemplateInput,
  type ListSessionTemplatesResponse,
  type SessionTemplate,
  type UpdateSessionTemplateInput,
} from "@repo/contracts/lms/session-template";

import { api } from "../api";
import { platformKeys } from "../api/keys";

import { type LibraryListParams } from "./use-library-exercises";

const DEFAULT_TAKE = 100;

const buildSessionTemplateQuery = (params: LibraryListParams, ownerId: string | undefined) => {
  const take = params.take ?? DEFAULT_TAKE;

  if (params.scope === "SYSTEM") {
    return { search: params.search, scope: "SYSTEM" as const, take };
  }

  if (params.scope === "OWN" && ownerId) {
    return { search: params.search, scope: "COACH" as const, ownerId, take };
  }

  return { search: params.search, take };
};

export const useSessionTemplatesPageData = (params: LibraryListParams = {}, ownerId?: string) =>
  useQuery<ListSessionTemplatesResponse>({
    queryKey: [
      ...platformKeys.library.sessionTemplates.page(),
      params.search ?? "",
      params.scope ?? "ALL",
      params.take ?? DEFAULT_TAKE,
      ownerId ?? "",
    ],
    queryFn: () => api.library.sessionTemplates.list(buildSessionTemplateQuery(params, ownerId)),
  });

export const useSessionTemplate = (id: string) =>
  useQuery({
    queryKey: platformKeys.library.sessionTemplates.byId(id),
    queryFn: () => api.library.sessionTemplates.getById(id),
    enabled: !!id,
  });

export const useCreateSessionTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation<SessionTemplate, Error, CreateSessionTemplateInput>({
    mutationFn: (data) => api.library.sessionTemplates.create(data),
    onSuccess: () => {
      toast.success("Session template created");
      queryClient.invalidateQueries({ queryKey: platformKeys.library.sessionTemplates.page() });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create session template");
    },
  });
};

type UpdateSessionTemplateVariables = {
  id: string;
  data: UpdateSessionTemplateInput;
};

export const useUpdateSessionTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation<SessionTemplate, Error, UpdateSessionTemplateVariables>({
    mutationFn: ({ id, data }) => api.library.sessionTemplates.update(id, data),
    onSuccess: (result) => {
      toast.success("Session template updated");
      queryClient.invalidateQueries({ queryKey: platformKeys.library.sessionTemplates.page() });
      queryClient.invalidateQueries({
        queryKey: platformKeys.library.sessionTemplates.byId(result.id),
      });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update session template");
    },
  });
};

export const useDeleteSessionTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => api.library.sessionTemplates.delete(id),
    onSuccess: () => {
      toast.success("Session template deleted");
      queryClient.invalidateQueries({ queryKey: platformKeys.library.sessionTemplates.page() });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete session template");
    },
  });
};

export const usePromoteSessionTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.library.sessionTemplates.promote(id),
    onSuccess: () => {
      toast.success("Session template promoted to SYSTEM");
      queryClient.invalidateQueries({ queryKey: platformKeys.library.sessionTemplates.page() });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to promote session template");
    },
  });
};

export const useDemoteSessionTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, newOwnerId }: { id: string; newOwnerId: string }) =>
      api.library.sessionTemplates.demote(id, { newOwnerId }),
    onSuccess: () => {
      toast.success("Session template demoted to COACH");
      queryClient.invalidateQueries({ queryKey: platformKeys.library.sessionTemplates.page() });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to demote session template");
    },
  });
};
