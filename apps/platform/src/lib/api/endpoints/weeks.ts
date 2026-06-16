import { type ApiClient } from "@repo/api-client";
import type {
  CloneWeekFromRequest,
  CloneWeekResponse,
  GetWeekResponse,
  PopulatedWeeksResponse,
  UpdateWeekNotesData,
  Week,
} from "@repo/contracts/lms/week";

export const createWeeksAPI = (client: ApiClient) => ({
  getByDate: (planId: string, startDate: string): Promise<GetWeekResponse> =>
    client.request(`/api/platform/training-plans/${planId}/weeks/${startDate}`),

  listPopulated: (planId: string): Promise<PopulatedWeeksResponse> =>
    client.request(`/api/platform/training-plans/${planId}/weeks`),

  updateNotes: (planId: string, startDate: string, data: UpdateWeekNotesData): Promise<Week> =>
    client.request(`/api/platform/training-plans/${planId}/weeks/${startDate}`, "PUT", data),

  cloneFrom: (
    planId: string,
    startDate: string,
    data: CloneWeekFromRequest,
  ): Promise<CloneWeekResponse> =>
    client.request(
      `/api/platform/training-plans/${planId}/weeks/${startDate}/clone-from`,
      "POST",
      data,
    ),
});
