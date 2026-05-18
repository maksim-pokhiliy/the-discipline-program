import { type ApiClient } from "@repo/api-client";
import type {
  AssignBlockLabelsData,
  Block,
  CreateBlockData,
  ReorderBlocksData,
  UpdateBlockData,
} from "@repo/contracts/lms/block";

export const createBlocksAPI = (client: ApiClient) => ({
  create: (planId: string, sessionId: string, data: CreateBlockData): Promise<Block> =>
    client.request(
      `/api/platform/training-plans/${planId}/sessions/${sessionId}/blocks`,
      "POST",
      data,
    ),

  update: (planId: string, blockId: string, data: UpdateBlockData): Promise<Block> =>
    client.request(`/api/platform/training-plans/${planId}/blocks/${blockId}`, "PUT", data),

  delete: (planId: string, blockId: string): Promise<void> =>
    client.requestNoContent(`/api/platform/training-plans/${planId}/blocks/${blockId}`, "DELETE"),

  reorder: (
    planId: string,
    sessionId: string,
    data: ReorderBlocksData,
  ): Promise<{ blocks: Block[] }> =>
    client.request(
      `/api/platform/training-plans/${planId}/sessions/${sessionId}/blocks/reorder`,
      "PUT",
      data,
    ),

  assignLabels: (planId: string, blockId: string, data: AssignBlockLabelsData): Promise<Block> =>
    client.request(`/api/platform/training-plans/${planId}/blocks/${blockId}/labels`, "PUT", data),
});
