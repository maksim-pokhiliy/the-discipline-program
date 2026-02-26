import { type ApiClient } from "@repo/api-client";
import type { CoachActionItem, ReconcileResponse } from "@repo/contracts/coach-action-item";

export const createCoachActionItemsAPI = (client: ApiClient) => ({
  reconcile: (): Promise<ReconcileResponse> =>
    client.request("/api/platform/coach/action-items/reconcile", "POST"),

  resolve: (itemId: string): Promise<CoachActionItem> =>
    client.request(`/api/platform/coach/action-items/${itemId}/resolve`, "POST"),
});
