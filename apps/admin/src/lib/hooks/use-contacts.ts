"use client";

import { useQuery } from "@tanstack/react-query";

import { adminApi } from "../api";

export const useContacts = () =>
  useQuery({
    queryKey: ["admin", "contacts"],
    queryFn: adminApi.contacts.getAll,
  });
