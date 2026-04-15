import { type ApiClient } from "@repo/api-client";
import type {
  CoachAthleteDetail,
  CoachAthletesData,
} from "@repo/contracts/coaching/coach-athletes";

export const createCoachAthletesAPI = (client: ApiClient) => ({
  getAthletes: (): Promise<CoachAthletesData> => client.request("/api/platform/coach/athletes"),
  getAthleteDetail: (userId: string): Promise<CoachAthleteDetail> =>
    client.request(`/api/platform/coach/athletes/${userId}`),
});
