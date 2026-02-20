import type {
  AthleteFlag,
  CreateAthleteFlagData,
  GetAthleteFlagsResponse,
  UpdateAthleteFlagData,
} from "@repo/contracts/athlete-flag";

import { apiClient } from "../client";

export const athleteFlagsAPI = {
  getAll: (): Promise<GetAthleteFlagsResponse> => apiClient.request("/api/platform/coach/flags"),

  getById: (id: string): Promise<AthleteFlag> =>
    apiClient.request(`/api/platform/coach/flags/${id}`),

  create: (data: CreateAthleteFlagData): Promise<AthleteFlag> =>
    apiClient.request("/api/platform/coach/flags", "POST", data),

  update: (id: string, data: UpdateAthleteFlagData): Promise<AthleteFlag> =>
    apiClient.request(`/api/platform/coach/flags/${id}`, "PUT", data),

  resolve: (id: string): Promise<AthleteFlag> =>
    apiClient.request(`/api/platform/coach/flags/${id}/resolve`, "POST"),

  delete: (id: string): Promise<void> =>
    apiClient.request(`/api/platform/coach/flags/${id}`, "DELETE"),
};
