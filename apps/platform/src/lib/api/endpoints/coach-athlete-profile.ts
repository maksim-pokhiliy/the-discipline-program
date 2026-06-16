import { type ApiClient } from "@repo/api-client";
import type { AthleteProfile } from "@repo/contracts/coaching/athlete-profile";

export const createCoachAthleteProfileAPI = (client: ApiClient) => ({
  get: (athleteUserId: string): Promise<AthleteProfile> =>
    client.request(`/api/platform/coach/athletes/${athleteUserId}/profile`),
});
