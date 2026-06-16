import { type ApiClient } from "@repo/api-client";
import type { CreateExerciseData, Exercise } from "@repo/contracts/lms/exercise";

export const createExercisesAPI = (client: ApiClient) => ({
  list: (): Promise<Exercise[]> => client.request("/api/platform/exercises", "GET"),

  create: (data: CreateExerciseData): Promise<Exercise> =>
    client.request("/api/platform/exercises", "POST", data),
});
