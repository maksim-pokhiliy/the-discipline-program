import { type ApiClient } from "@repo/api-client";
import type {
  CoachActionItem,
  ResolveActionItemRequest,
} from "@repo/contracts/coaching/coach-action-item";

export const createCoachActionItemsAPI = (client: ApiClient) => ({
  resolve: (itemId: string, body?: ResolveActionItemRequest): Promise<CoachActionItem> =>
    client.request(`/api/platform/coach/action-items/${itemId}/resolve`, "POST", body),
});
