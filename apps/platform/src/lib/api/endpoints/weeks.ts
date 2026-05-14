import { type ApiClient } from "@repo/api-client";
import type { GetWeekResponse, UpdateWeekNotesData, Week } from "@repo/contracts/lms/week";

export const createWeeksAPI = (client: ApiClient) => ({
  getByDate: (planId: string, startDate: string): Promise<GetWeekResponse> =>
    client.request(`/api/platform/training-plans/${planId}/weeks/${startDate}`),

  updateNotes: (planId: string, startDate: string, data: UpdateWeekNotesData): Promise<Week> =>
    client.request(`/api/platform/training-plans/${planId}/weeks/${startDate}`, "PUT", data),
});
