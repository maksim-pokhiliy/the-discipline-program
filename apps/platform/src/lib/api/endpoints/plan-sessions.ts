import { type ApiClient } from "@repo/api-client";
import type {
  CreatePlanSessionRequest,
  CreatePlanSessionResponse,
  GetPlanSessionsResponse,
  UpdatePlanSessionRequest,
  UpdatePlanSessionResponse,
} from "@repo/contracts/lms/plan-session";

export const createPlanSessionsAPI = (client: ApiClient) => ({
  listByDay: (planId: string, dayId: string): Promise<GetPlanSessionsResponse> =>
    client.request(`/api/platform/training-plans/${planId}/days/${dayId}/sessions`),

  create: (
    planId: string,
    dayId: string,
    data: CreatePlanSessionRequest,
  ): Promise<CreatePlanSessionResponse> =>
    client.request(`/api/platform/training-plans/${planId}/days/${dayId}/sessions`, "POST", data),

  update: (
    planId: string,
    sessionId: string,
    data: UpdatePlanSessionRequest,
  ): Promise<UpdatePlanSessionResponse> =>
    client.request(`/api/platform/training-plans/${planId}/sessions/${sessionId}`, "PUT", data),

  delete: (planId: string, sessionId: string): Promise<void> =>
    client.requestNoContent(
      `/api/platform/training-plans/${planId}/sessions/${sessionId}`,
      "DELETE",
    ),
});
