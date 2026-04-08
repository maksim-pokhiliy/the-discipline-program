"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  type AdminContactsPageData,
  type GetContactByIdResponse,
  type UpdateContactRequest,
} from "@repo/contracts/contact";
import { adminKeys, createCrudHooks } from "@repo/query";

import { api } from "../api";

const useNavigate = () => useRouter().push;

const contactHooks = createCrudHooks<AdminContactsPageData, GetContactByIdResponse>({
  entityName: "Contact",
  keys: adminKeys.contacts,
  api: {
    getPageData: api.contacts.getPageData,
    getById: api.contacts.getById,
    delete: api.contacts.delete,
  },
  redirectTo: "/contacts",
  useNavigate,
  additionalInvalidateKeys: [adminKeys.dashboard()],
});

export const useContactsPageData = contactHooks.usePageData;
export const useContact = contactHooks.useById;
export const useDeleteContact = contactHooks.useDelete;

type UseUpdateContactOptions = {
  onSuccess?: (data: GetContactByIdResponse) => void;
};

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
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update contact");
    },
  });
};
