import { type ApiClient } from "@repo/api-client";
import type { CoachAthletesData } from "@repo/contracts/coach-athletes";

export const createCoachAthletesAPI = (client: ApiClient) => ({
  getAthletes: (): Promise<CoachAthletesData> => client.request("/api/platform/coach/athletes"),
});
