import { type ApiClient } from "@repo/api-client";
import type { GetPlanBlocksResponse } from "@repo/contracts/lms/plan-block";

export const createPlanBlocksAPI = (client: ApiClient) => ({
  listBySession: (planId: string, sessionId: string): Promise<GetPlanBlocksResponse> =>
    client.request(`/api/platform/training-plans/${planId}/sessions/${sessionId}/blocks`),
});
