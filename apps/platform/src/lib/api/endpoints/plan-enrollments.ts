import { type ApiClient } from "@repo/api-client";
import { type PlanRosterEntry } from "@repo/contracts/coaching/plan-roster";
import type {
  CreatePlanEnrollmentData,
  PlanEnrollment,
  UpdatePlanEnrollmentData,
} from "@repo/contracts/lms/plan-enrollment";

export const createPlanEnrollmentsAPI = (client: ApiClient) => ({
  getAll: (planId: string): Promise<PlanRosterEntry[]> =>
    client.request(`/api/platform/training-plans/${planId}/enrollments`),

  create: (planId: string, data: CreatePlanEnrollmentData): Promise<PlanEnrollment> =>
    client.request(`/api/platform/training-plans/${planId}/enrollments`, "POST", data),

  update: (planId: string, id: string, data: UpdatePlanEnrollmentData): Promise<PlanEnrollment> =>
    client.request(`/api/platform/training-plans/${planId}/enrollments/${id}`, "PUT", data),

  delete: (planId: string, id: string): Promise<void> =>
    client.request(`/api/platform/training-plans/${planId}/enrollments/${id}`, "DELETE"),
});
