"use client";

import { useQuery } from "@tanstack/react-query";

import { adminKeys } from "@repo/query";

import { api } from "../api";

export const useContacts = () =>
  useQuery({
    queryKey: adminKeys.contacts.all(),
    queryFn: api.contacts.getAll,
  });
