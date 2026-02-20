"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type {
  AthleteFlag,
  CreateAthleteFlagData,
  GetAthleteFlagsResponse,
  UpdateAthleteFlagData,
} from "@repo/contracts/athlete-flag";
import { createCrudHooks, platformKeys } from "@repo/query";

import { api } from "../api";

const athleteFlagHooks = createCrudHooks<
  GetAthleteFlagsResponse,
  AthleteFlag,
  CreateAthleteFlagData,
  UpdateAthleteFlagData
>({
  entityName: "Athlete Flag",
  keys: platformKeys.athleteFlags,
  api: {
    getPageData: api.athleteFlags.getAll,
    getById: api.athleteFlags.getById,
    create: api.athleteFlags.create,
    update: api.athleteFlags.update,
    delete: api.athleteFlags.delete,
  },
  redirectTo: "/coach",
});

export const useAthleteFlagsPageData = athleteFlagHooks.usePageData;
export const useAthleteFlag = athleteFlagHooks.useById;
export const useCreateAthleteFlag = athleteFlagHooks.useCreate;
export const useUpdateAthleteFlag = athleteFlagHooks.useUpdate;
export const useDeleteAthleteFlag = athleteFlagHooks.useDelete;

export const useResolveAthleteFlag = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.athleteFlags.resolve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformKeys.athleteFlags.page() });
      queryClient.invalidateQueries({ queryKey: platformKeys.coachDashboard.data() });
      toast.success("Flag resolved");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to resolve flag");
    },
  });
};
