"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  type AdminContactsPageData,
  type GetContactByIdResponse,
  type UpdateContactRequest,
} from "@repo/contracts/contact";
import { adminKeys, STALE_TIMES } from "@repo/query";

import { api } from "../api";

interface UseContactsPageDataOptions {
  initialData?: AdminContactsPageData;
}

export const useContactsPageData = ({ initialData }: UseContactsPageDataOptions = {}) => {
  return useQuery({
    queryKey: adminKeys.contacts.page(),
    queryFn: api.contacts.getPageData,
    initialData,
    staleTime: initialData ? STALE_TIMES.MEDIUM : STALE_TIMES.NONE,
  });
};

export const useContact = (id: string, initialData?: GetContactByIdResponse) => {
  return useQuery({
    queryKey: adminKeys.contacts.byId(id),
    queryFn: () => api.contacts.getById(id),
    initialData,
    enabled: !!id,
    staleTime: initialData ? STALE_TIMES.MEDIUM : STALE_TIMES.NONE,
  });
};

interface UseUpdateContactOptions {
  onSuccess?: (data: GetContactByIdResponse) => void;
}

export const useUpdateContact = ({ onSuccess }: UseUpdateContactOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateContactRequest }) =>
      api.contacts.update(id, data),
    onSuccess: (data) => {
      toast.success("Contact updated");
      queryClient.invalidateQueries({ queryKey: adminKeys.contacts.page() });
      queryClient.invalidateQueries({ queryKey: adminKeys.contacts.byId(data.id) });
      queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
      onSuccess?.(data);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update contact");
    },
  });
};

export const useDeleteContact = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.contacts.delete,
    onSuccess: () => {
      toast.success("Contact deleted successfully");
      queryClient.invalidateQueries({ queryKey: adminKeys.contacts.page() });
      queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete contact");
    },
  });
};
