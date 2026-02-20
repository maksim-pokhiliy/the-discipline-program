import type {
  CoachNote,
  CreateCoachNoteData,
  GetCoachNotesResponse,
  UpdateCoachNoteData,
} from "@repo/contracts/coach-note";

import { apiClient } from "../client";

export const coachNotesAPI = {
  getAll: (): Promise<GetCoachNotesResponse> => apiClient.request("/api/platform/coach/notes"),

  getById: (id: string): Promise<CoachNote> => apiClient.request(`/api/platform/coach/notes/${id}`),

  create: (data: CreateCoachNoteData): Promise<CoachNote> =>
    apiClient.request("/api/platform/coach/notes", "POST", data),

  update: (id: string, data: UpdateCoachNoteData): Promise<CoachNote> =>
    apiClient.request(`/api/platform/coach/notes/${id}`, "PUT", data),

  delete: (id: string): Promise<void> =>
    apiClient.request(`/api/platform/coach/notes/${id}`, "DELETE"),
};
