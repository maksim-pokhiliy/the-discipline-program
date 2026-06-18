import { type ApiClient } from "@repo/api-client";
import type { SessionDetailResponse } from "@repo/contracts/lms/session-detail";

export const createAthleteSessionViewAPI = (client: ApiClient) => ({
  get: (sessionId: string): Promise<SessionDetailResponse> =>
    client.request(`/api/platform/athlete/sessions/${sessionId}`),
});
