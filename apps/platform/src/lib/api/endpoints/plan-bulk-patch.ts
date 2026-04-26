import { type ApiClient } from "@repo/api-client";
import {
  type BulkPatchPlanInput,
  type BulkPatchPlanResponse,
} from "@repo/contracts/lms/training-plan";

export const createPlanBulkPatchAPI = (client: ApiClient) => ({
  patch: (planId: string, data: BulkPatchPlanInput): Promise<BulkPatchPlanResponse> =>
    client.request(`/api/platform/training-plans/${planId}/patch`, "POST", data),
});
