import { type ApiClient } from "@repo/api-client";
import type {
  CreatePlanCoachAssignmentInput,
  CreatePlanCoachAssignmentResponse,
  ListPlanCoachAssignmentsResponse,
} from "@repo/contracts/lms/plan-coach-assignment";

export const createPlanCoachAssignmentsAPI = (client: ApiClient) => ({
  list: (planId: string): Promise<ListPlanCoachAssignmentsResponse> =>
    client.request(`/api/platform/training-plans/${planId}/coaches`),

  create: (
    planId: string,
    data: CreatePlanCoachAssignmentInput,
  ): Promise<CreatePlanCoachAssignmentResponse> =>
    client.request(`/api/platform/training-plans/${planId}/coaches`, "POST", data),

  delete: (planId: string, assignmentId: string): Promise<void> =>
    client.request(`/api/platform/training-plans/${planId}/coaches/${assignmentId}`, "DELETE"),
});
