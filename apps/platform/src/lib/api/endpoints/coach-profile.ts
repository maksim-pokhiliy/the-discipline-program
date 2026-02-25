import { type ApiClient } from "@repo/api-client";
import type { CoachProfile, UpdateCoachProfileData } from "@repo/contracts/coach-profile";

export const createCoachProfileAPI = (client: ApiClient) => ({
  get: (): Promise<CoachProfile> => client.request("/api/platform/coach/profile"),

  update: (data: UpdateCoachProfileData): Promise<CoachProfile> =>
    client.request("/api/platform/coach/profile", "PUT", data),
});
