import { type ApiClient } from "@repo/api-client";
import type { GetPlanSessionsResponse } from "@repo/contracts/lms/plan-session";

export const createPlanSessionsAPI = (client: ApiClient) => ({
  listByDay: (planId: string, dayId: string): Promise<GetPlanSessionsResponse> =>
    client.request(`/api/platform/training-plans/${planId}/days/${dayId}/sessions`),
});
