import { type ApiClient } from "@repo/api-client";
import type {
  CoachCredential,
  CreateCoachCredentialData,
  UpdateCoachCredentialData,
} from "@repo/contracts/coaching/coach-credential";

export const createCoachCredentialAPI = (client: ApiClient) => ({
  create: (data: CreateCoachCredentialData): Promise<CoachCredential> =>
    client.request("/api/platform/coach/credentials", "POST", data),

  update: (id: string, data: UpdateCoachCredentialData): Promise<CoachCredential> =>
    client.request(`/api/platform/coach/credentials/${id}`, "PUT", data),

  delete: (id: string): Promise<void> =>
    client.requestNoContent(`/api/platform/coach/credentials/${id}`, "DELETE"),
});
