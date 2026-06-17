import { type ApiClient } from "@repo/api-client";
import type {
  CreatePerformedSessionRequest,
  CreatePerformedSessionResponse,
} from "@repo/contracts/lms/performed-session";

export const createPerformedSessionsAPI = (client: ApiClient) => ({
  create: (data: CreatePerformedSessionRequest): Promise<CreatePerformedSessionResponse> =>
    client.request("/api/platform/athlete/performed-sessions", "POST", data),
});
