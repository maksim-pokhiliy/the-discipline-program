import { type ApiClient } from "@repo/api-client";
import type { SessionDetailResponse } from "@repo/contracts/lms/session-detail";

export const createAthleteSessionViewAPI = (client: ApiClient) => ({
  get: async (sessionId: string): Promise<SessionDetailResponse> => {
    const response = await client.request<SessionDetailResponse>(
      `/api/platform/athlete/sessions/${sessionId}`,
    );

    return {
      ...response,
      session: {
        ...response.session,
        completedAt:
          response.session.completedAt === null ? null : new Date(response.session.completedAt),
      },
    };
  },
});
