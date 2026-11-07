"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import { toast } from "sonner";

import {
  type AdminLocaleListItem,
  type CreateLocaleRequest,
  type Locale,
  type ReorderLocalesRequest,
  type ReorderLocalesResponse,
  type UpdateLocaleRequest,
} from "@repo/contracts/cms/locale";
import { ConflictError } from "@repo/errors";
import { notifyError } from "@repo/query";

import { api } from "../api";
import { adminKeys } from "../api/keys";

import { useNavigate } from "./use-navigate";

type LocaleUpdate = { code: string; data: UpdateLocaleRequest };
type LocaleToggle = { code: string; isEnabled: boolean };

export const useLocales = (): UseQueryResult<AdminLocaleListItem[], Error> =>
  useQuery({ queryKey: adminKeys.locales.list(), queryFn: api.locales.list });

export const useLocale = (code: string): UseQueryResult<AdminLocaleListItem | undefined, Error> =>
  useQuery({
    queryKey: adminKeys.locales.list(),
    queryFn: api.locales.list,
    select: (locales) => locales.find((locale) => locale.code === code),
  });

export const useCreateLocale = (): UseMutationResult<Locale, Error, CreateLocaleRequest> => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: api.locales.create,
    onSuccess: () => {
      toast.success("Language created successfully");
      queryClient.invalidateQueries({ queryKey: adminKeys.locales.list() });
      navigate("/languages");
    },
  });
};

export const useUpdateLocale = (): UseMutationResult<void, Error, LocaleUpdate> => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: ({ code, data }) => api.locales.update(code, data),
    onSuccess: () => {
      toast.success("Language updated successfully");
      queryClient.invalidateQueries({ queryKey: adminKeys.locales.list() });
      navigate("/languages");
    },
    onError: (error) => notifyError(error, "Failed to update language"),
  });
};

export const useToggleLocale = (): UseMutationResult<void, Error, LocaleToggle> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ code, isEnabled }) => api.locales.update(code, { isEnabled }),
    onSuccess: () => {
      toast.success("Language status updated");
      queryClient.invalidateQueries({ queryKey: adminKeys.locales.list() });
    },
    onError: (error) => notifyError(error, "Failed to update language status"),
  });
};

export const useReorderLocales = (): UseMutationResult<
  ReorderLocalesResponse,
  Error,
  ReorderLocalesRequest
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.locales.reorder,
    onSuccess: async (locales) => {
      queryClient.setQueryData(adminKeys.locales.list(), locales);
      toast.success("Languages reordered");
      await queryClient.invalidateQueries({ queryKey: adminKeys.locales.list() });
    },
    onError: (error) => {
      if (error instanceof ConflictError) {
        toast.error(
          "The language list changed in the meantime and was reloaded. Try the move again.",
        );
        queryClient.invalidateQueries({ queryKey: adminKeys.locales.list() });

        return;
      }

      notifyError(error, "Failed to reorder languages");
    },
  });
};

export const useDeleteLocale = (): UseMutationResult<void, Error, string> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.locales.delete,
    onSuccess: () => {
      toast.success("Language deleted successfully");
      queryClient.invalidateQueries({ queryKey: adminKeys.locales.list() });
    },
  });
};
