import { type ApiClient } from "@repo/api-client";
import type {
  CreatePlanDayRequest,
  CreatePlanDayResponse,
  GetPlanDaysResponse,
  UpdatePlanDayRequest,
  UpdatePlanDayResponse,
} from "@repo/contracts/lms/plan-day";
import { formatDateParam } from "@repo/shared";

export const createPlanDaysAPI = (client: ApiClient) => ({
  listByPlan: (planId: string, range: { from: Date; to: Date }): Promise<GetPlanDaysResponse> =>
    client.request(`/api/platform/training-plans/${planId}/days`, "GET", undefined, {
      from: formatDateParam(range.from),
      to: formatDateParam(range.to),
    }),

  upsert: (planId: string, data: CreatePlanDayRequest): Promise<CreatePlanDayResponse> =>
    client.request(`/api/platform/training-plans/${planId}/days`, "POST", {
      date: formatDateParam(data.date),
      ...(data.dayTypeId !== undefined && { dayTypeId: data.dayTypeId }),
    }),

  update: (
    planId: string,
    dayId: string,
    data: UpdatePlanDayRequest,
  ): Promise<UpdatePlanDayResponse> =>
    client.request(`/api/platform/training-plans/${planId}/days/${dayId}`, "PUT", data),

  delete: (planId: string, dayId: string): Promise<void> =>
    client.requestNoContent(`/api/platform/training-plans/${planId}/days/${dayId}`, "DELETE"),
});
