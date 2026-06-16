import { type ApiClient } from "@repo/api-client";
import type { CoachNote, CreateCoachNoteData } from "@repo/contracts/coaching/coach-note";

export const createCoachNotesAPI = (client: ApiClient) => ({
  list: (athleteId?: string): Promise<CoachNote[]> =>
    client.request(`/api/platform/coach/notes${athleteId ? `?athleteId=${athleteId}` : ""}`),

  create: (data: CreateCoachNoteData): Promise<CoachNote> =>
    client.request("/api/platform/coach/notes", "POST", data),

  delete: (noteId: string): Promise<void> =>
    client.requestNoContent(`/api/platform/coach/notes/${noteId}`, "DELETE"),
});
