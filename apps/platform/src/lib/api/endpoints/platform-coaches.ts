import { type ApiClient } from "@repo/api-client";
import type { CoachListItem } from "@repo/contracts/iam/user";

export const createPlatformCoachesAPI = (client: ApiClient) => ({
  list: (): Promise<CoachListItem[]> => client.request("/api/platform/coaches"),
});
