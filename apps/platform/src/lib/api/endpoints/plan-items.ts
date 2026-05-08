import { type ApiClient } from "@repo/api-client";
import type {
  CreatePlanItemRequest,
  CreatePlanItemResponse,
  GetPlanItemsResponse,
  UpdatePlanItemRequest,
  UpdatePlanItemResponse,
} from "@repo/contracts/lms/plan-item";

export const createPlanItemsAPI = (client: ApiClient) => ({
  listByBlock: (planId: string, blockId: string): Promise<GetPlanItemsResponse> =>
    client.request(`/api/platform/training-plans/${planId}/blocks/${blockId}/items`),

  create: (
    planId: string,
    blockId: string,
    data: CreatePlanItemRequest,
  ): Promise<CreatePlanItemResponse> =>
    client.request(`/api/platform/training-plans/${planId}/blocks/${blockId}/items`, "POST", data),

  update: (
    planId: string,
    itemId: string,
    data: UpdatePlanItemRequest,
  ): Promise<UpdatePlanItemResponse> =>
    client.request(`/api/platform/training-plans/${planId}/items/${itemId}`, "PUT", data),

  delete: (planId: string, itemId: string): Promise<void> =>
    client.requestNoContent(`/api/platform/training-plans/${planId}/items/${itemId}`, "DELETE"),
});
