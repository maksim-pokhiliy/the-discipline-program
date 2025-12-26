"use client";

import { adminKeys } from "@repo/query";
import { useQuery } from "@tanstack/react-query";

import { api } from "../api";

export const useContacts = () =>
  useQuery({
    queryKey: adminKeys.contacts.all(),
    queryFn: api.contacts.getAll,
  });
