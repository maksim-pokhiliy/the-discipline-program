import { type ApiClient } from "@repo/api-client";
import type { Exercise } from "@repo/contracts/lms/exercise";

export const createExercisesAPI = (client: ApiClient) => ({
  list: (): Promise<Exercise[]> => client.request("/api/platform/exercises", "GET"),
});
