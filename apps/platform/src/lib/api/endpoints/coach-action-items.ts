import { type ApiClient } from "@repo/api-client";
import type { CoachActionItem } from "@repo/contracts/coaching/coach-action-item";

export const createCoachActionItemsAPI = (client: ApiClient) => ({
  resolve: (itemId: string): Promise<CoachActionItem> =>
    client.request(`/api/platform/coach/action-items/${itemId}/resolve`, "POST"),
});
