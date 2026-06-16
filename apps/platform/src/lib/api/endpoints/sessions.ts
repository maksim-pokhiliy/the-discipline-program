import { type ApiClient } from "@repo/api-client";
import type { DayOfWeek } from "@repo/contracts/lms/_shared";
import type {
  CreateSessionData,
  ReorderSessionsData,
  Session,
  UpdateSessionData,
} from "@repo/contracts/lms/session";

export const createSessionsAPI = (client: ApiClient) => ({
  create: (
    planId: string,
    startDate: string,
    dayOfWeek: DayOfWeek,
    data: CreateSessionData,
  ): Promise<Session> =>
    client.request(
      `/api/platform/training-plans/${planId}/weeks/${startDate}/days/${dayOfWeek}/sessions`,
      "POST",
      data,
    ),

  update: (planId: string, sessionId: string, data: UpdateSessionData): Promise<Session> =>
    client.request(`/api/platform/training-plans/${planId}/sessions/${sessionId}`, "PUT", data),

  delete: (planId: string, sessionId: string): Promise<void> =>
    client.requestNoContent(
      `/api/platform/training-plans/${planId}/sessions/${sessionId}`,
      "DELETE",
    ),

  duplicate: (planId: string, sessionId: string): Promise<Session> =>
    client.request(
      `/api/platform/training-plans/${planId}/sessions/${sessionId}/duplicate`,
      "POST",
      {},
    ),

  reorder: (
    planId: string,
    startDate: string,
    dayOfWeek: DayOfWeek,
    data: ReorderSessionsData,
  ): Promise<{ sessions: Session[] }> =>
    client.request(
      `/api/platform/training-plans/${planId}/weeks/${startDate}/days/${dayOfWeek}/sessions/reorder`,
      "PUT",
      data,
    ),
});
