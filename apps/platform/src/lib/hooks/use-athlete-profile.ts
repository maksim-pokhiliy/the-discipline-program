"use client";

import { useQuery } from "@tanstack/react-query";

import type {
  GetAthleteProfileResponse,
  UpdateAthleteProfileRequest,
  UpdateAthleteProfileResponse,
} from "@repo/contracts/coaching/athlete-profile";
import { useOptimisticMutation } from "@repo/query";

import { api } from "../api";
import { platformKeys } from "../api/keys";

export const useAthleteProfile = () => {
  return useQuery({
    queryKey: platformKeys.athleteProfile.data(),
    queryFn: () => api.athleteProfile.get(),
  });
};

export const applyAthleteProfileUpdate = (
  prev: GetAthleteProfileResponse,
  data: UpdateAthleteProfileRequest,
): GetAthleteProfileResponse => ({
  ...prev,
  ...(data.gender !== undefined && { gender: data.gender }),
  ...(data.heightCm !== undefined && { heightCm: data.heightCm }),
  ...(data.weightKg !== undefined && { weightKg: data.weightKg }),
  ...(data.healthStatus !== undefined && { healthStatus: data.healthStatus }),
  ...(data.healthNote !== undefined && { healthNote: data.healthNote }),
  ...(data.profileSelections !== undefined && { profileSelections: data.profileSelections }),
});

export const useUpdateAthleteProfile = () =>
  useOptimisticMutation<
    GetAthleteProfileResponse,
    UpdateAthleteProfileRequest,
    UpdateAthleteProfileResponse
  >({
    mutationFn: (data) => api.athleteProfile.update(data),
    queryKey: () => platformKeys.athleteProfile.data(),
    transform: applyAthleteProfileUpdate,
    invalidateKeys: () => [platformKeys.athleteProfile.data()],
    errorMessage: "Failed to update profile",
  });
