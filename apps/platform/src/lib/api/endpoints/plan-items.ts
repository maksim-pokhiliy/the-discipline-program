import { type ApiClient } from "@repo/api-client";
import type { GetPlanItemsResponse } from "@repo/contracts/lms/plan-item";

export const createPlanItemsAPI = (client: ApiClient) => ({
  listByBlock: (planId: string, blockId: string): Promise<GetPlanItemsResponse> =>
    client.request(`/api/platform/training-plans/${planId}/blocks/${blockId}/items`),
});
