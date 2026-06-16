import { type ApiClient } from "@repo/api-client";
import type {
  CoachProfilePageData,
  SelfUpdateCoachProfileData,
} from "@repo/contracts/coaching/coach-profile";

export const createCoachProfileAPI = (client: ApiClient) => ({
  getPageData: (): Promise<CoachProfilePageData> => client.request("/api/platform/coach/profile"),

  update: (data: SelfUpdateCoachProfileData): Promise<CoachProfilePageData> =>
    client.request("/api/platform/coach/profile", "PUT", data),
});
