"use client";

import { useQuery } from "@tanstack/react-query";

import { marketingKeys } from "@repo/query";

import { api } from "../api";

export const useProducts = () =>
  useQuery({
    queryKey: marketingKeys.products.all(),
    queryFn: api.products.getAll,
  });
