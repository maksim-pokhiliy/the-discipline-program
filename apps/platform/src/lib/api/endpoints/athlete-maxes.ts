import { type ApiClient } from "@repo/api-client";
import type { AthleteMax, CreateAthleteMaxData } from "@repo/contracts/athlete-max";

export const createAthleteMaxesAPI = (client: ApiClient) => ({
  getAll: (exerciseId?: string): Promise<AthleteMax[]> =>
    client.request(
      "/api/platform/athlete-maxes",
      "GET",
      undefined,
      exerciseId ? { exerciseId } : undefined,
    ),

  getForPlanExercises: (planId: string, exerciseIds: string[]): Promise<AthleteMax[]> =>
    client.request("/api/platform/athlete-maxes/plan-exercises", "POST", {
      planId,
      exerciseIds,
    }),

  create: (data: CreateAthleteMaxData): Promise<AthleteMax> =>
    client.request("/api/platform/athlete-maxes", "POST", data),

  delete: (id: string): Promise<void> =>
    client.request(`/api/platform/athlete-maxes/${id}`, "DELETE"),
});
