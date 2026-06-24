"use client";

import { useQuery } from "@tanstack/react-query";

import type { ProfileAxis } from "@repo/contracts/coaching/profile-axis";

import { api } from "../api";
import { platformKeys } from "../api/keys";

export const useProfileAxes = () =>
  useQuery<ProfileAxis[]>({
    queryKey: platformKeys.profileAxes.all(),
    queryFn: () => api.profileAxes.list(),
  });
