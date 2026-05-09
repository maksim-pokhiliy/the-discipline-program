import { type ApiClient } from "@repo/api-client";
import type {
  CreatePlanBlockRequest,
  CreatePlanBlockResponse,
  GetPlanBlocksResponse,
  UpdatePlanBlockRequest,
  UpdatePlanBlockResponse,
} from "@repo/contracts/lms/plan-block";

export const createPlanBlocksAPI = (client: ApiClient) => ({
  listBySession: (planId: string, sessionId: string): Promise<GetPlanBlocksResponse> =>
    client.request(`/api/platform/training-plans/${planId}/sessions/${sessionId}/blocks`),

  create: (
    planId: string,
    sessionId: string,
    data: CreatePlanBlockRequest,
  ): Promise<CreatePlanBlockResponse> =>
    client.request(
      `/api/platform/training-plans/${planId}/sessions/${sessionId}/blocks`,
      "POST",
      data,
    ),

  update: (
    planId: string,
    blockId: string,
    data: UpdatePlanBlockRequest,
  ): Promise<UpdatePlanBlockResponse> =>
    client.request(`/api/platform/training-plans/${planId}/blocks/${blockId}`, "PUT", data),

  delete: (planId: string, blockId: string): Promise<void> =>
    client.requestNoContent(`/api/platform/training-plans/${planId}/blocks/${blockId}`, "DELETE"),
});
