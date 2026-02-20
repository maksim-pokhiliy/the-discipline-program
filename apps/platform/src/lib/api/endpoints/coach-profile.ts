import type { CoachProfile, UpdateCoachProfileData } from "@repo/contracts/coach-profile";

import { apiClient } from "../client";

export const coachProfileAPI = {
  get: (): Promise<CoachProfile> => apiClient.request("/api/platform/coach/profile"),

  update: (data: UpdateCoachProfileData): Promise<CoachProfile> =>
    apiClient.request("/api/platform/coach/profile", "PUT", data),
};
