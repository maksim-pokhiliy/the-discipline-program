import { type ApiClient } from "@repo/api-client";
import type {
  CreatePlanEnrollmentRequest,
  CreatePlanEnrollmentResponse,
  EnrollmentStatus,
  GetPlanEnrollmentsResponse,
  PausePlanEnrollmentResponse,
  ResumePlanEnrollmentResponse,
} from "@repo/contracts/lms/plan-enrollment";

export const createPlanEnrollmentsAPI = (client: ApiClient) => ({
  listByPlan: (planId: string, status?: EnrollmentStatus): Promise<GetPlanEnrollmentsResponse> =>
    client.request(
      `/api/platform/training-plans/${planId}/enrollments`,
      "GET",
      undefined,
      status !== undefined ? { status } : undefined,
    ),

  create: (
    planId: string,
    data: CreatePlanEnrollmentRequest,
  ): Promise<CreatePlanEnrollmentResponse> =>
    client.request(`/api/platform/training-plans/${planId}/enrollments`, "POST", data),

  pause: (planId: string, enrollmentId: string): Promise<PausePlanEnrollmentResponse> =>
    client.request(
      `/api/platform/training-plans/${planId}/enrollments/${enrollmentId}/pause`,
      "POST",
    ),

  resume: (planId: string, enrollmentId: string): Promise<ResumePlanEnrollmentResponse> =>
    client.request(
      `/api/platform/training-plans/${planId}/enrollments/${enrollmentId}/resume`,
      "POST",
    ),

  remove: (planId: string, enrollmentId: string): Promise<void> =>
    client.requestNoContent(
      `/api/platform/training-plans/${planId}/enrollments/${enrollmentId}`,
      "DELETE",
    ),
});
