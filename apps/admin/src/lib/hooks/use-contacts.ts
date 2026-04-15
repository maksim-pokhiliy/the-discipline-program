"use client";

import {
  type AdminContactsPageData,
  type GetContactByIdResponse,
  type UpdateContactRequest,
} from "@repo/contracts/cms/contact";
import { createCrudHooks } from "@repo/query";

import { api } from "../api";
import { adminKeys } from "../api/keys";

import { useNavigate } from "./use-navigate";

const contactHooks = createCrudHooks<
  AdminContactsPageData,
  GetContactByIdResponse,
  never,
  UpdateContactRequest
>({
  entityName: "Contact",
  keys: adminKeys.contacts,
  api: {
    getPageData: api.contacts.getPageData,
    getById: api.contacts.getById,
    update: api.contacts.update,
    delete: api.contacts.delete,
  },
  redirectTo: "/contacts",
  useNavigate,
  additionalInvalidateKeys: [adminKeys.dashboard()],
});

export const useContactsPageData = contactHooks.usePageData;
export const useContact = contactHooks.useById;
export const useUpdateContact = contactHooks.useUpdate;
export const useDeleteContact = contactHooks.useDelete;
