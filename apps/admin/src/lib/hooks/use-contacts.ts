"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "../api";

export const useContacts = () =>
  useQuery({
    queryKey: ["admin", "contacts"],
    queryFn: api.contacts.getAll,
  });
