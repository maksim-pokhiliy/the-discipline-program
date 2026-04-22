import { type ApiClient } from "@repo/api-client";
import type {
  CreateCoachInviteData,
  ResendCoachInviteResponse,
} from "@repo/contracts/coaching/coach-invite";
import type { User } from "@repo/contracts/iam/user";

export const createCoachInviteAPI = (client: ApiClient) => ({
  create: (data: CreateCoachInviteData): Promise<User> =>
    client.request("/api/platform/coach/invites", "POST", data),
  resend: (inviteeUserId: string): Promise<ResendCoachInviteResponse> =>
    client.request(`/api/platform/coach/invites/${inviteeUserId}/resend`, "POST"),
});
