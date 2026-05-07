"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "../api";
import { platformKeys } from "../api/keys";

export const useItemsByBlock = (planId: string, blockId: string) =>
  useQuery({
    queryKey: platformKeys.planItems.byBlock(planId, blockId),
    queryFn: () => api.planItems.listByBlock(planId, blockId),
  });
