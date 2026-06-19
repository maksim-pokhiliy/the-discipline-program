import { type ApiClient } from "@repo/api-client";
import type { RecordsViewResponse } from "@repo/contracts/lms/records-view";

export const createAthleteRecordsAPI = (client: ApiClient) => ({
  get: (): Promise<RecordsViewResponse> => client.request("/api/platform/athlete/records"),
});
