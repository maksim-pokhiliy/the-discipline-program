import { type ApiClient } from "@repo/api-client";
import type {
  CoachNote,
  CreateCoachNoteData,
  GetCoachNotesResponse,
  UpdateCoachNoteData,
} from "@repo/contracts/coach-note";

export const createCoachNotesAPI = (client: ApiClient) => ({
  getAll: (): Promise<GetCoachNotesResponse> => client.request("/api/platform/coach/notes"),

  getById: (id: string): Promise<CoachNote> => client.request(`/api/platform/coach/notes/${id}`),

  create: (data: CreateCoachNoteData): Promise<CoachNote> =>
    client.request("/api/platform/coach/notes", "POST", data),

  update: (id: string, data: UpdateCoachNoteData): Promise<CoachNote> =>
    client.request(`/api/platform/coach/notes/${id}`, "PUT", data),

  delete: (id: string): Promise<void> =>
    client.request(`/api/platform/coach/notes/${id}`, "DELETE"),
});
