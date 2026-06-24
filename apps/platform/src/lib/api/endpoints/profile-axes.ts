import { type ApiClient } from "@repo/api-client";
import type { CreateProfileAxisData, ProfileAxis } from "@repo/contracts/coaching/profile-axis";

export const createProfileAxesAPI = (client: ApiClient) => ({
  list: (): Promise<ProfileAxis[]> => client.request("/api/platform/profile-axes"),

  listForAthlete: (): Promise<ProfileAxis[]> =>
    client.request("/api/platform/athlete/profile-axes"),

  create: (data: CreateProfileAxisData): Promise<ProfileAxis> =>
    client.request("/api/platform/profile-axes", "POST", data),
});
