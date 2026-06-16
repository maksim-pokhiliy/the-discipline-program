"use client";

import { useQuery } from "@tanstack/react-query";

import type {
  CoachProfilePageData,
  SelfUpdateCoachProfileData,
} from "@repo/contracts/coaching/coach-profile";
import { useOptimisticMutation } from "@repo/query";

import { api } from "../api";
import { platformKeys } from "../api/keys";

export const useCoachProfile = () => {
  return useQuery({
    queryKey: platformKeys.coachProfile.data(),
    queryFn: () => api.coachProfile.getPageData(),
  });
};

export const applyCoachProfileUpdate = (
  prev: CoachProfilePageData,
  data: SelfUpdateCoachProfileData,
): CoachProfilePageData => ({
  ...prev,
  user: {
    ...prev.user,
    ...(data.name !== undefined && { name: data.name }),
    ...(data.image !== undefined && { image: data.image }),
    ...(data.timezone !== undefined && { timezone: data.timezone }),
  },
  profile: {
    ...prev.profile,
    ...(data.bio !== undefined && { bio: data.bio }),
    ...(data.location !== undefined && { location: data.location }),
    ...(data.specialties !== undefined && { specialties: data.specialties }),
  },
});

export const useUpdateCoachProfile = () =>
  useOptimisticMutation<CoachProfilePageData, SelfUpdateCoachProfileData>({
    mutationFn: (data) => api.coachProfile.update(data),
    queryKey: () => platformKeys.coachProfile.data(),
    transform: applyCoachProfileUpdate,
    invalidateKeys: () => [platformKeys.coachProfile.data()],
    errorMessage: "Failed to update profile",
  });
