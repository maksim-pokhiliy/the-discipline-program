import { type ApiClient } from "@repo/api-client";
import type { GetPlanDaysResponse } from "@repo/contracts/lms/plan-day";
import { formatDateParam } from "@repo/shared";

export const createPlanDaysAPI = (client: ApiClient) => ({
  listByPlan: (planId: string, range: { from: Date; to: Date }): Promise<GetPlanDaysResponse> =>
    client.request(`/api/platform/training-plans/${planId}/days`, "GET", undefined, {
      from: formatDateParam(range.from),
      to: formatDateParam(range.to),
    }),
});
