import { type ApiClient } from "@repo/api-client";
import type {
  GetAthleteProfileResponse,
  UpdateAthleteProfileRequest,
  UpdateAthleteProfileResponse,
} from "@repo/contracts/athlete-profile";

export const createAthleteProfileAPI = (client: ApiClient) => ({
  get: (): Promise<GetAthleteProfileResponse> => client.request("/api/platform/athlete/profile"),

  update: (data: UpdateAthleteProfileRequest): Promise<UpdateAthleteProfileResponse> =>
    client.request("/api/platform/athlete/profile", "PUT", data),
});
