import { type ApiClient } from "@repo/api-client";
import type {
  AthleteFlag,
  CreateAthleteFlagData,
  GetAthleteFlagsResponse,
  UpdateAthleteFlagData,
} from "@repo/contracts/athlete-flag";

export const createAthleteFlagsAPI = (client: ApiClient) => ({
  getAll: (): Promise<GetAthleteFlagsResponse> => client.request("/api/platform/coach/flags"),

  getById: (id: string): Promise<AthleteFlag> => client.request(`/api/platform/coach/flags/${id}`),

  create: (data: CreateAthleteFlagData): Promise<AthleteFlag> =>
    client.request("/api/platform/coach/flags", "POST", data),

  update: (id: string, data: UpdateAthleteFlagData): Promise<AthleteFlag> =>
    client.request(`/api/platform/coach/flags/${id}`, "PUT", data),

  resolve: (id: string): Promise<AthleteFlag> =>
    client.request(`/api/platform/coach/flags/${id}/resolve`, "POST"),

  delete: (id: string): Promise<void> =>
    client.request(`/api/platform/coach/flags/${id}`, "DELETE"),
});
