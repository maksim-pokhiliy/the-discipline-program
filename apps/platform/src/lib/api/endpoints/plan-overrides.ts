import { type ApiClient } from "@repo/api-client";
import {
  type CreatePlanOverrideBody,
  type CreatePlanOverrideResponse,
  type EffectivePlanWeek,
  type GetPlanOverrideResponse,
  type ListEnrollmentOverridesResponse,
  type UpdatePlanOverrideInput,
  type UpdatePlanOverrideResponse,
} from "@repo/contracts/lms/plan-override";

export const createPlanOverridesAPI = (client: ApiClient) => ({
  listForEnrollment: (enrollmentId: string): Promise<ListEnrollmentOverridesResponse> =>
    client.request(`/api/platform/enrollments/${enrollmentId}/overrides`),

  createForEnrollment: (
    enrollmentId: string,
    data: CreatePlanOverrideBody,
  ): Promise<CreatePlanOverrideResponse> =>
    client.request(`/api/platform/enrollments/${enrollmentId}/overrides`, "POST", data),

  getById: (overrideId: string): Promise<GetPlanOverrideResponse> =>
    client.request(`/api/platform/overrides/${overrideId}`),

  update: (
    overrideId: string,
    data: UpdatePlanOverrideInput,
  ): Promise<UpdatePlanOverrideResponse> =>
    client.request(`/api/platform/overrides/${overrideId}`, "PUT", data),

  delete: (overrideId: string): Promise<void> =>
    client.request(`/api/platform/overrides/${overrideId}`, "DELETE"),

  getEffectivePlan: (enrollmentId: string, weekIndex: number): Promise<EffectivePlanWeek> =>
    client.request(`/api/platform/enrollments/${enrollmentId}/effective-plan`, "GET", undefined, {
      week: String(weekIndex),
    }),
});
